/**
 * controllers/staff.controller.js
 *
 * School Admin manages teachers (STAFF role users):
 *   - Add a teacher (creates Supabase auth user + Prisma profile)
 *   - List all teachers in the tenant
 *   - Deactivate a teacher
 *   - Assign teacher → class + subject
 *   - Remove assignment
 *   - List assignments (optionally filtered by class or teacher)
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { recordAudit } from '../services/audit.service.js';

// ─── Teacher CRUD ────────────────────────────────────────────────────────────

export const createTeacherSchema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  phone:    z.string().optional(),
});

export async function createTeacher(req, res) {
  const { fullName, email, password, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.badRequest('A user with that email already exists');

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName, role: 'STAFF', tenantId: req.tenantId },
  });

  if (authError) {
    throw ApiError.badRequest(`Could not create login account: ${authError.message}`);
  }

  const supabaseUserId = authData.user.id;

  let teacher;
  try {
    teacher = await prisma.user.create({
      data: {
        tenantId:   req.tenantId,
        role:       'STAFF',
        fullName,
        email,
        phone:      phone || null,
        supabaseId: supabaseUserId,
        active:     true,
      },
    });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {});
    throw err;
  }

  await recordAudit({
    tenantId:   req.tenantId,
    actorId:    req.user.id,
    action:     'TEACHER_CREATED',
    targetType: 'User',
    targetId:   teacher.id,
    metadata:   { email, fullName },
  });

  res.status(201).json({
    teacher: {
      id:        teacher.id,
      fullName:  teacher.fullName,
      email:     teacher.email,
      phone:     teacher.phone,
      active:    teacher.active,
      createdAt: teacher.createdAt,
    },
  });
}

export async function listTeachers(req, res) {
  const teachers = await prisma.user.findMany({
    where:   { tenantId: req.tenantId, role: 'STAFF' },
    orderBy: { fullName: 'asc' },
    select: {
      id: true, fullName: true, email: true, active: true, createdAt: true,
      teacherAssignments: {
        include: {
          class:   { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });
  res.json({ teachers });
}

export async function deactivateTeacher(req, res) {
  const { id } = req.params;

  const teacher = await prisma.user.findFirst({
    where: { id, tenantId: req.tenantId, role: 'STAFF' },
  });
  if (!teacher) throw ApiError.notFound('Teacher not found');
  if (!teacher.active) throw ApiError.badRequest('Teacher is already inactive');

  await prisma.user.update({ where: { id }, data: { active: false } });

  // Also disable the Supabase auth user so they cannot log in
  await supabaseAdmin.auth.admin.updateUserById(teacher.supabaseId, {
    ban_duration: '87600h', // 10 years ≈ permanent
  }).catch(() => {
    // Non-fatal: Prisma record is already deactivated
  });

  await recordAudit({
    tenantId:   req.tenantId,
    actorId:    req.user.id,
    action:     'TEACHER_DEACTIVATED',
    targetType: 'User',
    targetId:   id,
    metadata:   { email: teacher.email },
  });

  res.json({ message: `${teacher.fullName} has been deactivated` });
}

// ─── Assignment CRUD ─────────────────────────────────────────────────────────

export const assignSchema = z.object({
  teacherId: z.string().uuid(),
  classId:   z.string().uuid(),
  subjectId: z.string().uuid(),
});

export async function assign(req, res) {
  const { teacherId, classId, subjectId } = req.body;

  // Verify all three belong to this tenant in one go
  const [teacher, klass, subject] = await Promise.all([
    prisma.user.findFirst({    where: { id: teacherId, tenantId: req.tenantId, role: 'STAFF' } }),
    prisma.class.findFirst({   where: { id: classId,   tenantId: req.tenantId } }),
    prisma.subject.findFirst({ where: { id: subjectId, tenantId: req.tenantId } }),
  ]);

  if (!teacher) throw ApiError.notFound('Teacher not found in this school');
  if (!klass)   throw ApiError.notFound('Class not found in this school');
  if (!subject) throw ApiError.notFound('Subject not found in this school');

  const assignment = await prisma.teacherClassSubject.upsert({
    where:  { teacherId_classId_subjectId: { teacherId, classId, subjectId } },
    create: { teacherId, classId, subjectId },
    update: {},
    include: {
      class:   { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, fullName: true } },
    },
  });

  await recordAudit({
    tenantId:   req.tenantId,
    actorId:    req.user.id,
    action:     'TEACHER_ASSIGNED',
    targetType: 'TeacherClassSubject',
    targetId:   assignment.id,
    metadata:   { teacherId, classId, subjectId },
  });

  res.status(201).json({ assignment });
}

export async function removeAssignment(req, res) {
  const { assignmentId } = req.params;

  const assignment = await prisma.teacherClassSubject.findFirst({
    where: {
      id:      assignmentId,
      teacher: { tenantId: req.tenantId },
    },
  });
  if (!assignment) throw ApiError.notFound('Assignment not found');

  await prisma.teacherClassSubject.delete({ where: { id: assignmentId } });

  res.json({ message: 'Assignment removed' });
}

export async function listAssignments(req, res) {
  const { classId, teacherId } = req.query;

  const assignments = await prisma.teacherClassSubject.findMany({
    where: {
      teacher: { tenantId: req.tenantId },
      ...(classId   ? { classId }   : {}),
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      class:   { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
  });

  res.json({ assignments });
}
