/**
 * controllers/grade.controller.js
 *
 * Multi-score grade entry: caScore, midtermScore, examScore.
 * Aggregate formula lives in grade.service.js.
 *
 * Permission rule:
 *  - SCHOOL_ADMIN can always enter/edit grades for any class+subject in their tenant.
 *  - STAFF (teacher) may only enter grades for class+subject combinations they have
 *    been explicitly assigned to via TeacherClassSubject (by the admin).
 *  - No one may edit a grade that has been finalized.
 *
 * Key endpoint:
 *  POST /grades/sheet  — bulk upsert for the whole spreadsheet in one request.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { computeAggregate } from '../services/grade.service.js';

// ─── Permission helper ────────────────────────────────────────────────────────

async function assertTeacherPermission({ userId, role, classId, subjectId }) {
  if (role === 'SCHOOL_ADMIN') return; // Admins always have access

  const assignment = await prisma.teacherClassSubject.findFirst({
    where: { teacherId: userId, classId, subjectId },
  });
  if (!assignment) {
    throw ApiError.forbidden(
      'You have not been assigned to this class and subject combination. Contact your administrator.'
    );
  }
}

// ─── Fetch class roster with existing grades ──────────────────────────────────

export async function classGradeSheet(req, res) {
  const { classId, subjectId, termId } = req.params;

  // Tenant-check the class
  const klass = await prisma.class.findFirst({ where: { id: classId, tenantId: req.tenantId } });
  if (!klass) throw ApiError.notFound('Class not found');

  // Verify teacher permission (admin passes through)
  await assertTeacherPermission({
    userId: req.user.id, role: req.user.role, classId, subjectId,
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true, fullName: true, admissionNumber: true,
          grades: {
            where: { subjectId, termId },
          },
        },
      },
    },
    orderBy: { student: { fullName: 'asc' } },
  });

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');

  const sheet = enrollments.map((e) => {
    const grade = e.student.grades[0] ?? null;
    return {
      studentId:      e.student.id,
      fullName:       e.student.fullName,
      admissionNumber:e.student.admissionNumber,
      gradeId:        grade?.id ?? null,
      caScore:        grade?.caScore ?? null,
      midtermScore:   grade?.midtermScore ?? null,
      examScore:      grade?.examScore ?? null,
      aggregate:      grade?.aggregate ?? null,
      remarks:        grade?.remarks ?? '',
      finalized:      grade?.finalized ?? false,
      finalizedAt:    grade?.finalizedAt ?? null,
    };
  });

  res.json({
    sheet,
    meta: {
      class:   { id: klass.id, name: klass.name },
      subject: { id: subject.id, name: subject.name },
      termId,
      studentCount: sheet.length,
    },
  });
}

// ─── Bulk sheet save ──────────────────────────────────────────────────────────

const scoreRowSchema = z.object({
  studentId:    z.string().uuid(),
  caScore:      z.number().min(0).max(100).nullable().optional(),
  midtermScore: z.number().min(0).max(100).nullable().optional(),
  examScore:    z.number().min(0).max(100).nullable().optional(),
  remarks:      z.string().max(200).optional(),
});

export const bulkUpsertSchema = z.object({
  classId:   z.string().uuid(),
  subjectId: z.string().uuid(),
  termId:    z.string().uuid(),
  rows:      z.array(scoreRowSchema).min(1),
});

export async function bulkUpsertSheet(req, res) {
  const { classId, subjectId, termId, rows } = req.body;

  // Permission check
  await assertTeacherPermission({
    userId: req.user.id, role: req.user.role, classId, subjectId,
  });

  // All students must belong to this tenant
  const studentIds = rows.map((r) => r.studentId);
  const validCount = await prisma.student.count({
    where: { id: { in: studentIds }, tenantId: req.tenantId },
  });
  if (validCount !== studentIds.length) {
    throw ApiError.badRequest('One or more students do not belong to this school');
  }

  // Check none are finalized
  const finalized = await prisma.grade.findMany({
    where: {
      studentId: { in: studentIds },
      subjectId,
      termId,
      finalized: true,
    },
    select: { studentId: true },
  });
  if (finalized.length > 0) {
    const ids = finalized.map((g) => g.studentId).join(', ');
    throw ApiError.forbidden(
      `Cannot edit finalized grades. Affected student IDs: ${ids}`
    );
  }

  // Upsert each row inside a single transaction
  const results = await prisma.$transaction(
    rows.map((row) => {
      const aggregate = computeAggregate({
        caScore:      row.caScore      ?? null,
        midtermScore: row.midtermScore ?? null,
        examScore:    row.examScore    ?? null,
      });

      const data = {
        caScore:      row.caScore      ?? null,
        midtermScore: row.midtermScore ?? null,
        examScore:    row.examScore    ?? null,
        aggregate,
        remarks:      row.remarks ?? null,
        enteredById:  req.user.id,
      };

      return prisma.grade.upsert({
        where: {
          studentId_subjectId_termId: {
            studentId: row.studentId,
            subjectId,
            termId,
          },
        },
        create: { studentId: row.studentId, subjectId, termId, ...data },
        update: data,
      });
    })
  );

  res.json({ saved: results.length, grades: results });
}

// ─── Finalize ─────────────────────────────────────────────────────────────────

export async function finalizeSheet(req, res) {
  const { classId, subjectId, termId } = req.params;

  await assertTeacherPermission({
    userId: req.user.id, role: req.user.role, classId, subjectId,
  });

  // Get all student IDs for this class
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, class: { tenantId: req.tenantId } },
    select: { studentId: true },
  });
  const studentIds = enrollments.map((e) => e.studentId);

  const result = await prisma.grade.updateMany({
    where: {
      studentId: { in: studentIds },
      subjectId,
      termId,
      finalized: false,
    },
    data: { finalized: true, finalizedAt: new Date() },
  });

  res.json({ message: `${result.count} grade(s) finalized for this class and subject` });
}

// ─── Legacy single-student endpoints (kept for backward compat) ───────────────

async function assertTenantStudent(tenantId, studentId) {
  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw ApiError.notFound('Student not found');
}

export const caSchema = z.object({
  studentId:    z.string(),
  subjectId:    z.string(),
  termId:       z.string(),
  caScore:      z.number().min(0).max(100),
});

export async function submitCa(req, res) {
  const { studentId, subjectId, termId, caScore } = req.body;
  await assertTenantStudent(req.tenantId, studentId);
  await assertTeacherPermission({ userId: req.user.id, role: req.user.role, classId: null, subjectId });

  const existing = await prisma.grade.findUnique({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
  });
  if (existing?.finalized) throw ApiError.forbidden('Grade is finalized');

  const merged = {
    caScore,
    midtermScore: existing?.midtermScore ?? null,
    examScore:    existing?.examScore    ?? null,
  };
  const aggregate = computeAggregate(merged);

  const grade = await prisma.grade.upsert({
    where:  { studentId_subjectId_termId: { studentId, subjectId, termId } },
    create: { studentId, subjectId, termId, ...merged, aggregate, enteredById: req.user.id },
    update: { caScore, aggregate, enteredById: req.user.id },
  });
  res.status(201).json({ grade });
}

export const examSchema = z.object({
  studentId:  z.string(),
  subjectId:  z.string(),
  termId:     z.string(),
  examScore:  z.number().min(0).max(100),
});

export async function submitExam(req, res) {
  const { studentId, subjectId, termId, examScore } = req.body;
  await assertTenantStudent(req.tenantId, studentId);

  const existing = await prisma.grade.findUnique({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
  });
  if (existing?.finalized) throw ApiError.forbidden('Grade is finalized');

  const merged = {
    caScore:      existing?.caScore      ?? null,
    midtermScore: existing?.midtermScore ?? null,
    examScore,
  };
  const aggregate = computeAggregate(merged);

  const grade = await prisma.grade.upsert({
    where:  { studentId_subjectId_termId: { studentId, subjectId, termId } },
    create: { studentId, subjectId, termId, ...merged, aggregate, enteredById: req.user.id },
    update: { examScore, aggregate, enteredById: req.user.id },
  });
  res.status(201).json({ grade });
}

export async function finalize(req, res) {
  const { studentId, termId } = req.params;
  await assertTenantStudent(req.tenantId, studentId);

  const result = await prisma.grade.updateMany({
    where:  { studentId, termId },
    data:   { finalized: true, finalizedAt: new Date() },
  });
  res.json({ message: `${result.count} grade(s) finalized` });
}
