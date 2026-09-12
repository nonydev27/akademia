/**
 * controllers/reportcard.controller.js
 *
 * Workflow:
 *   Teacher submits → status: SUBMITTED
 *   Admin approves  → status: APPROVED, then fee-check determines RELEASED or WITHHELD
 *   Admin can also reject back to DRAFT
 */

import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getStudentBalance } from '../services/fee.service.js';
import { generateReportCardPdf } from '../services/pdf.service.js';
import { uploadReportCard, downloadReportCard } from '../services/storage.service.js';
import { sendResultEmail, sendFeeReminderEmail } from '../services/email.service.js';
import { sendResultConfirmationSms, sendFeeReminderSms } from '../services/sms.service.js';
import logger from '../utils/logger.js';

async function loadStudentAndTerm(tenantId, studentId, termId) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { guardians: { include: { guardian: true } } },
  });
  if (!student) throw ApiError.notFound('Student not found');
  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term) throw ApiError.notFound('Term not found');
  return { student, term };
}

// Teacher: submit results for admin review
export async function submit(req, res) {
  const { studentId, termId } = req.params;
  await loadStudentAndTerm(req.tenantId, studentId, termId);

  const reportCard = await prisma.reportCard.upsert({
    where:  { studentId_termId: { studentId, termId } },
    create: { studentId, termId, status: 'SUBMITTED', submittedAt: new Date() },
    update: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  res.json({ reportCard, message: 'Results submitted for admin approval' });
}

// Admin: approve and release (or withhold for fees)
export async function approve(req, res) {
  const { studentId, termId } = req.params;
  const { student, term } = await loadStudentAndTerm(req.tenantId, studentId, termId);

  const reportCard = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });
  if (!reportCard) throw ApiError.notFound('No submitted report card found');
  if (reportCard.status !== 'SUBMITTED') throw ApiError.badRequest('Report card is not in SUBMITTED state');

  const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
  const { balance } = await getStudentBalance(studentId);

  if (balance === 0) {
    const grades = await prisma.grade.findMany({
      where: { studentId, termId }, include: { subject: true },
    });
    const attendanceRecords = await prisma.attendance.findMany({ where: { studentId } });
    const present = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const total   = attendanceRecords.length;

    const pdfBuffer = await generateReportCardPdf({
      tenantName: tenant.name, student, term,
      grades: grades.map((g) => ({ subjectName: g.subject.name, caScore: g.caScore, examScore: g.examScore, aggregate: g.aggregate })),
      attendanceSummary: { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
    });

    const pdfPath = await uploadReportCard({ tenantId: req.tenantId, studentId, termId, pdfBuffer });

    const updated = await prisma.reportCard.update({
      where: { studentId_termId: { studentId, termId } },
      data:  { status: 'RELEASED', approvedAt: new Date(), approvedBy: req.user.id, publishedAt: new Date(), pdfUrl: pdfPath },
    });

    const guardianEmail = student.guardians[0]?.guardian?.email;
    const guardianPhone = student.guardians[0]?.guardian?.phone;
    const attempts = [];
    if (student.email) attempts.push(sendResultEmail({ tenantId: req.tenantId, to: student.email, studentName: student.fullName, pdfBuffer, termLabel: term.label, schoolName: tenant.name }));
    if (guardianEmail) attempts.push(sendResultEmail({ tenantId: req.tenantId, to: guardianEmail, studentName: student.fullName, pdfBuffer, termLabel: term.label, schoolName: tenant.name }));
    if (guardianPhone) attempts.push(sendResultConfirmationSms({ tenantId: req.tenantId, to: guardianPhone, studentName: student.fullName }));
    const outcomes = await Promise.allSettled(attempts);
    outcomes.forEach((o) => { if (o.status === 'rejected') logger.warn('Result notification failed', { message: o.reason?.message }); });

    return res.json({ reportCard: updated, status: 'RELEASED', balance });
  }

  const updated = await prisma.reportCard.update({
    where: { studentId_termId: { studentId, termId } },
    data:  { status: 'WITHHELD', approvedAt: new Date(), approvedBy: req.user.id },
  });

    const guardianEmail = student.guardians[0]?.guardian?.email;
    const guardianPhone = student.guardians[0]?.guardian?.phone;
    const attempts = [];
    if (guardianEmail) attempts.push(sendFeeReminderEmail({ tenantId: req.tenantId, to: guardianEmail, studentName: student.fullName, balance, termLabel: term.label, schoolName: tenant.name }));
    if (guardianPhone) attempts.push(sendFeeReminderSms({ tenantId: req.tenantId, to: guardianPhone, studentName: student.fullName, balance }));
    await Promise.allSettled(attempts);

  res.json({ reportCard: updated, status: 'WITHHELD', balance });
}

// Admin: reject back to DRAFT so teacher can re-submit
export async function reject(req, res) {
  const { studentId, termId } = req.params;
  await loadStudentAndTerm(req.tenantId, studentId, termId);

  const updated = await prisma.reportCard.upsert({
    where:  { studentId_termId: { studentId, termId } },
    create: { studentId, termId, status: 'DRAFT' },
    update: { status: 'DRAFT', submittedAt: null },
  });
  res.json({ reportCard: updated, message: 'Returned to teacher for revision' });
}

// List all report cards for admin (with status filter)
export async function listForTerm(req, res) {
  const { termId, status } = req.query;
  if (!termId) throw ApiError.badRequest('termId is required');

  const reportCards = await prisma.reportCard.findMany({
    where: {
      termId,
      student: { tenantId: req.tenantId },
      ...(status ? { status } : {}),
    },
    include: {
      student: { select: { id: true, fullName: true, admissionNumber: true } },
    },
    orderBy: { student: { fullName: 'asc' } },
  });

  const studentIds = reportCards.map((rc) => rc.studentId);
  const grades = await prisma.grade.findMany({
    where: {
      studentId: { in: studentIds },
      termId,
    },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });

  const gradesByStudent = {};
  grades.forEach((g) => {
    if (!gradesByStudent[g.studentId]) gradesByStudent[g.studentId] = [];
    gradesByStudent[g.studentId].push(g);
  });

  res.json({ reportCards: reportCards.map((rc) => ({
    ...rc,
    grades: (gradesByStudent[rc.studentId] || []).map((g) => ({
      subjectId: g.subject.id,
      subjectName: g.subject.name,
      subjectCode: g.subject.code,
      caScore: g.caScore,
      midtermScore: g.midtermScore,
      examScore: g.examScore,
      aggregate: g.aggregate,
      finalized: g.finalized,
    })),
  })) });
}

export async function getOne(req, res) {
  const { studentId, termId } = req.params;
  await loadStudentAndTerm(req.tenantId, studentId, termId);
  const reportCard = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });
  if (!reportCard) throw ApiError.notFound('Report card not found');
  res.json({ reportCard });
}

export async function downloadPdf(req, res) {
  const { studentId, termId } = req.params;
  const { student, term } = await loadStudentAndTerm(req.tenantId, studentId, termId);
  const reportCard = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });
  if (!reportCard || reportCard.status !== 'RELEASED') throw ApiError.forbidden('This report card has not been released');

  let pdfBuffer = reportCard.pdfUrl ? await downloadReportCard(reportCard.pdfUrl) : null;
  if (!pdfBuffer) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const grades = await prisma.grade.findMany({ where: { studentId, termId }, include: { subject: true } });
    const attendanceRecords = await prisma.attendance.findMany({ where: { studentId } });
    const present = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const total   = attendanceRecords.length;
    pdfBuffer = await generateReportCardPdf({
      tenantName: tenant.name, student, term,
      grades: grades.map((g) => ({ subjectName: g.subject.name, caScore: g.caScore, examScore: g.examScore, aggregate: g.aggregate })),
      attendanceSummary: { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
    });
    await uploadReportCard({ tenantId: req.tenantId, studentId, termId, pdfBuffer });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${student.fullName}-${term.label}-report-card.pdf"`);
  res.send(pdfBuffer);
}

// Kept for backward compat - admin direct publish (skips submit step)
export async function publish(req, res) {
  return approve(req, res);
}
