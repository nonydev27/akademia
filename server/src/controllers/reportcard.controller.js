/**
 * controllers/reportcard.controller.js — the Result-Fee Intercept (PRD section 6).
 *
 * publish(studentId, termId):
 *   1. Compute fee balance (services/fee.service.js).
 *   2. balance === 0 -> generate PDF, mark RELEASED, email+SMS the release.
 *      balance > 0   -> mark WITHHELD, email+SMS a payment demand.
 * The academic record (report_cards row) is committed regardless of whether
 * the notification succeeds — a failed send must not corrupt the record, it
 * is only logged to the communications table (see services/*.service.js).
 */

import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getStudentBalance } from '../services/fee.service.js';
import { generateReportCardPdf } from '../services/pdf.service.js';
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

async function notifyRelease({ tenantId, student, term, pdfBuffer, tenantName }) {
  const guardianEmail = student.guardians[0]?.guardian?.email;
  const guardianPhone = student.guardians[0]?.guardian?.phone;

  const attempts = [];
  if (student.email) {
    attempts.push(
      sendResultEmail({ tenantId, to: student.email, studentName: student.fullName, pdfBuffer, termLabel: term.label })
    );
  }
  if (guardianEmail) {
    attempts.push(
      sendResultEmail({ tenantId, to: guardianEmail, studentName: student.fullName, pdfBuffer, termLabel: term.label })
    );
  }
  if (guardianPhone) {
    attempts.push(sendResultConfirmationSms({ tenantId, to: guardianPhone, studentName: student.fullName }));
  }

  const outcomes = await Promise.allSettled(attempts);
  outcomes.forEach((o) => {
    if (o.status === 'rejected') logger.warn('Result notification failed', { message: o.reason?.message });
  });
}

async function notifyWithheld({ tenantId, student, term, balance }) {
  const guardianEmail = student.guardians[0]?.guardian?.email;
  const guardianPhone = student.guardians[0]?.guardian?.phone;

  const attempts = [];
  if (guardianEmail) {
    attempts.push(
      sendFeeReminderEmail({ tenantId, to: guardianEmail, studentName: student.fullName, balance, termLabel: term.label })
    );
  }
  if (guardianPhone) {
    attempts.push(sendFeeReminderSms({ tenantId, to: guardianPhone, studentName: student.fullName, balance }));
  }

  const outcomes = await Promise.allSettled(attempts);
  outcomes.forEach((o) => {
    if (o.status === 'rejected') logger.warn('Fee reminder notification failed', { message: o.reason?.message });
  });
}

export async function publish(req, res) {
  const { studentId, termId } = req.params;
  const { student, term } = await loadStudentAndTerm(req.tenantId, studentId, termId);
  const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });

  const { balance } = await getStudentBalance(studentId);

  if (balance === 0) {
    const grades = await prisma.grade.findMany({
      where: { studentId, termId },
      include: { subject: true },
    });
    const attendanceRecords = await prisma.attendance.findMany({ where: { studentId } });
    const present = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const total = attendanceRecords.length;
    const attendanceSummary = { present, total, percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };

    const pdfBuffer = await generateReportCardPdf({
      tenantName: tenant.name,
      student,
      term,
      grades: grades.map((g) => ({ subjectName: g.subject.name, caScore: g.caScore, examScore: g.examScore, aggregate: g.aggregate })),
      attendanceSummary,
    });

    const reportCard = await prisma.reportCard.upsert({
      where: { studentId_termId: { studentId, termId } },
      create: { studentId, termId, status: 'RELEASED', publishedAt: new Date() },
      update: { status: 'RELEASED', publishedAt: new Date() },
    });

    await notifyRelease({ tenantId: req.tenantId, student, term, pdfBuffer, tenantName: tenant.name });

    return res.json({ reportCard, status: 'RELEASED', balance });
  }

  const reportCard = await prisma.reportCard.upsert({
    where: { studentId_termId: { studentId, termId } },
    create: { studentId, termId, status: 'WITHHELD' },
    update: { status: 'WITHHELD' },
  });

  await notifyWithheld({ tenantId: req.tenantId, student, term, balance });

  res.json({ reportCard, status: 'WITHHELD', balance });
}

export async function getOne(req, res) {
  const { studentId, termId } = req.params;
  await loadStudentAndTerm(req.tenantId, studentId, termId);

  const reportCard = await prisma.reportCard.findUnique({
    where: { studentId_termId: { studentId, termId } },
  });
  if (!reportCard) throw ApiError.notFound('Report card not found');

  res.json({ reportCard });
}

export async function downloadPdf(req, res) {
  const { studentId, termId } = req.params;
  const { student, term } = await loadStudentAndTerm(req.tenantId, studentId, termId);
  const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });

  const reportCard = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });
  if (!reportCard || reportCard.status !== 'RELEASED') {
    throw ApiError.forbidden('This report card has not been released');
  }

  const grades = await prisma.grade.findMany({ where: { studentId, termId }, include: { subject: true } });
  const attendanceRecords = await prisma.attendance.findMany({ where: { studentId } });
  const present = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const total = attendanceRecords.length;
  const attendanceSummary = { present, total, percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };

  const pdfBuffer = await generateReportCardPdf({
    tenantName: tenant.name,
    student,
    term,
    grades: grades.map((g) => ({ subjectName: g.subject.name, caScore: g.caScore, examScore: g.examScore, aggregate: g.aggregate })),
    attendanceSummary,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${student.fullName}-${term.label}-report-card.pdf"`);
  res.send(pdfBuffer);
}
