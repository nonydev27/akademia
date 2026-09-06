/**
 * controllers/attendance.controller.js — submit + fetch attendance.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

async function assertTenantStudent(tenantId, studentId) {
  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw ApiError.notFound('Student not found');
}

export const submitSchema = z.object({
  date: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT', 'TARDY']),
      })
    )
    .min(1),
});

export async function submit(req, res) {
  const { date, records } = req.body;

  const studentIds = records.map((r) => r.studentId);
  const validCount = await prisma.student.count({ where: { id: { in: studentIds }, tenantId: req.tenantId } });
  if (validCount !== studentIds.length) throw ApiError.badRequest('One or more students do not belong to your school');

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date } },
        create: { studentId: r.studentId, date, status: r.status, markedByUserId: req.user.id },
        update: { status: r.status, markedByUserId: req.user.id },
      })
    )
  );

  res.status(201).json({ attendance: results });
}

export const classQuerySchema = z.object({
  date: z.coerce.date(),
});

export async function forClass(req, res) {
  const { date } = req.query;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: req.params.classId, class: { tenantId: req.tenantId } },
    include: {
      student: {
        include: { attendance: { where: { date: { gte: startOfDay, lte: endOfDay } } } },
      },
    },
  });

  const roster = enrollments.map((e) => ({
    student: { id: e.student.id, fullName: e.student.fullName, admissionNumber: e.student.admissionNumber },
    status: e.student.attendance[0]?.status ?? null,
  }));

  res.json({ roster, date });
}

export async function forStudent(req, res) {
  await assertTenantStudent(req.tenantId, req.params.id);

  const records = await prisma.attendance.findMany({
    where: { studentId: req.params.id },
    orderBy: { date: 'desc' },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  res.json({ records, summary: { total, present, percentage } });
}
