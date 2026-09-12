/**
 * controllers/attendance.controller.js
 *
 * - Teachers submit per-subject attendance (PRESENT/ABSENT) after PIN is verified client-side.
 * - subjectId is required for staff submissions.
 * - Admins get summary view only.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const submitSchema = z.object({
  date:      z.coerce.date(),
  subjectId: z.string().uuid(),
  records:   z.array(z.object({
    studentId: z.string(),
    status:    z.enum(['PRESENT', 'ABSENT']),
  })).min(1),
});

export async function submit(req, res) {
  const { date, subjectId, records } = req.body;

  // Verify subject belongs to this tenant
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');

  // Only assigned teacher or admin can mark attendance for this subject
  if (req.user.role === 'STAFF') {
    const assignment = await prisma.teacherClassSubject.findFirst({
      where: { subjectId, teacherId: req.user.id },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this subject');
  }

  const studentIds = records.map((r) => r.studentId);
  const validCount = await prisma.student.count({ where: { id: { in: studentIds }, tenantId: req.tenantId } });
  if (validCount !== studentIds.length) throw ApiError.badRequest('One or more students do not belong to your school');

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_subjectId_date: { studentId: r.studentId, subjectId, date } },
        create: { studentId: r.studentId, subjectId, date, status: r.status, markedByUserId: req.user.id },
        update: { status: r.status, markedByUserId: req.user.id },
      })
    )
  );

  res.status(201).json({ attendance: results });
}

export async function forClass(req, res) {
  const { date, subjectId } = req.query;
  if (!date) throw ApiError.badRequest('date is required');

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: req.params.classId, class: { tenantId: req.tenantId } },
    include: {
      student: {
        include: {
          attendance: {
            where: {
              date:      { gte: startOfDay, lte: endOfDay },
              ...(subjectId ? { subjectId } : {}),
            },
          },
        },
      },
    },
  });

  const roster = enrollments.map((e) => ({
    student: { id: e.student.id, fullName: e.student.fullName, admissionNumber: e.student.admissionNumber },
    status:  e.student.attendance[0]?.status ?? null,
  }));

  res.json({ roster, date });
}

// Admin summary: attendance stats per subject for a class
export async function summary(req, res) {
  const { classId, subjectId, fromDate, toDate } = req.query;
  if (!classId) throw ApiError.badRequest('classId is required');

  // Verify class belongs to tenant
  const klass = await prisma.class.findFirst({ where: { id: classId, tenantId: req.tenantId } });
  if (!klass) throw ApiError.notFound('Class not found');

  const dateFilter = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate)   dateFilter.lte = new Date(toDate);

  const records = await prisma.attendance.findMany({
    where: {
      student:   { tenantId: req.tenantId, enrollments: { some: { classId } } },
      ...(subjectId ? { subjectId } : {}),
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    include: {
      student: { select: { id: true, fullName: true, admissionNumber: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Group by student
  const studentMap = {};
  for (const r of records) {
    const sid = r.student.id;
    if (!studentMap[sid]) {
      studentMap[sid] = { student: r.student, total: 0, present: 0, absent: 0 };
    }
    studentMap[sid].total++;
    if (r.status === 'PRESENT') studentMap[sid].present++;
    else studentMap[sid].absent++;
  }

  const summary = Object.values(studentMap).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  res.json({ summary, totalRecords: records.length });
}

export async function forStudent(req, res) {
  const student = await prisma.student.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!student) throw ApiError.notFound('Student not found');

  const records = await prisma.attendance.findMany({
    where: { studentId: req.params.id },
    include: { subject: { select: { id: true, name: true, code: true } } },
    orderBy: { date: 'desc' },
  });

  const total   = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  res.json({ records, summary: { total, present, percentage } });
}
