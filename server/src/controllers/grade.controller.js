/**
 * controllers/grade.controller.js — CA/exam entry, aggregation, finalize workflow.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { computeAggregate } from '../services/grade.service.js';

async function assertTenantStudent(tenantId, studentId) {
  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw ApiError.notFound('Student not found');
}

async function upsertScore({ tenantId, studentId, subjectId, termId, field, value }) {
  await assertTenantStudent(tenantId, studentId);

  const existing = await prisma.grade.findUnique({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
  });
  if (existing?.finalized) {
    throw ApiError.forbidden('This grade has been finalized and can no longer be edited');
  }

  const merged = { caScore: existing?.caScore ?? null, examScore: existing?.examScore ?? null, [field]: value };
  const aggregate = computeAggregate(merged);

  return prisma.grade.upsert({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
    create: { studentId, subjectId, termId, ...merged, aggregate },
    update: { [field]: value, aggregate },
  });
}

export const caSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  termId: z.string(),
  caScore: z.number().min(0).max(100),
});

export async function submitCa(req, res) {
  const { studentId, subjectId, termId, caScore } = req.body;
  const grade = await upsertScore({ tenantId: req.tenantId, studentId, subjectId, termId, field: 'caScore', value: caScore });
  res.status(201).json({ grade });
}

export const examSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  termId: z.string(),
  examScore: z.number().min(0).max(100),
});

export async function submitExam(req, res) {
  const { studentId, subjectId, termId, examScore } = req.body;
  const grade = await upsertScore({ tenantId: req.tenantId, studentId, subjectId, termId, field: 'examScore', value: examScore });
  res.status(201).json({ grade });
}

export async function finalize(req, res) {
  const { studentId, termId } = req.params;
  await assertTenantStudent(req.tenantId, studentId);

  const result = await prisma.grade.updateMany({
    where: { studentId, termId },
    data: { finalized: true, finalizedAt: new Date() },
  });

  res.json({ message: `${result.count} grade(s) finalized` });
}

export async function classGradeSheet(req, res) {
  const { classId, termId } = req.params;

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, class: { tenantId: req.tenantId } },
    include: {
      student: {
        include: { grades: { where: { termId }, include: { subject: true } } },
      },
    },
  });

  const sheet = enrollments.map((e) => ({
    student: { id: e.student.id, fullName: e.student.fullName, admissionNumber: e.student.admissionNumber },
    grades: e.student.grades,
  }));

  res.json({ sheet });
}
