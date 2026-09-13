/**
 * controllers/student.controller.js — student CRUD with extended profile.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getStudentBalance } from '../services/fee.service.js';
import { nextStudentId, peekNextStudentId, deriveClassCode } from '../services/code.service.js';

export const listQuerySchema = z.object({
  search:   z.string().optional(),
  classId:  z.string().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function list(req, res) {
  const { search, classId, page = 1, pageSize = 20 } = req.query;

  const where = {
    tenantId: req.tenantId,
    ...(search ? {
      OR: [
        { fullName:        { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(classId ? { enrollments: { some: { classId } } } : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { enrollments: { include: { class: true } } },
      skip:    (Number(page) - 1) * Number(pageSize),
      take:    Number(pageSize),
      orderBy: { fullName: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  res.json({ students, total, page, pageSize });
}

export const createStudentSchema = z.object({
  // admissionNumber is optional: when omitted it is auto-generated as
  // <SCHOOL_CODE>-001 from the school's running sequence.
  admissionNumber:  z.string().min(1).optional(),
  fullName:         z.string().min(2),
  dateOfBirth:      z.coerce.date().optional(),
  gender:           z.string().optional(),
  nationality:      z.string().optional(),
  religion:         z.string().optional(),
  address:          z.string().optional(),
  email:            z.string().email().optional().or(z.literal('')),
  phone:            z.string().optional(),
  // Academic
  previousSchool:   z.string().optional(),
  classId:          z.string().optional(),
  // Co-curricular
  sports:           z.string().optional(),
  clubs:            z.string().optional(),
  otherActivities:  z.string().optional(),
  // Identification
  nhisNumber:       z.string().optional(),
  profilePicUrl:    z.string().url().optional().or(z.literal('')),
});

export async function create(req, res) {
  const {
    admissionNumber: providedNumber, fullName, dateOfBirth, gender, nationality, religion,
    address, email, phone, previousSchool, classId,
    sports, clubs, otherActivities, nhisNumber, profilePicUrl,
  } = req.body;

  // If a class was supplied, make sure it belongs to this school.
  if (classId) {
    const klass = await prisma.class.findFirst({ where: { id: classId, tenantId: req.tenantId } });
    if (!klass) throw ApiError.badRequest('Class not found in this school');
  }

  // Student ID: use the admin's value if given, otherwise auto-generate
  // <SCHOOL_CODE>-NNN from this school's running sequence.
  const admissionNumber = providedNumber?.trim() || (await nextStudentId(req.tenantId));

  const existing = await prisma.student.findUnique({
    where: { tenantId_admissionNumber: { tenantId: req.tenantId, admissionNumber } },
  });
  if (existing) throw ApiError.badRequest('A student with that Student ID already exists');

  const student = await prisma.student.create({
    data: {
      tenantId: req.tenantId,
      admissionNumber,
      fullName,
      dateOfBirth:     dateOfBirth || undefined,
      gender:          gender || null,
      nationality:     nationality || null,
      religion:        religion || null,
      address:         address || null,
      email:           email || null,
      phone:           phone || null,
      previousSchool:  previousSchool || null,
      sports:          sports || null,
      clubs:           clubs || null,
      otherActivities: otherActivities || null,
      nhisNumber:      nhisNumber || null,
      profilePicUrl:   profilePicUrl || null,
      ...(classId ? { enrollments: { create: { classId } } } : {}),
    },
  });

  res.status(201).json({ student });
}

async function findTenantStudent(tenantId, id) {
  const student = await prisma.student.findFirst({ where: { id, tenantId } });
  if (!student) throw ApiError.notFound('Student not found');
  return student;
}

export async function getNextStudentId(req, res) {
  // Read-only preview: this endpoint feeds a form field, so it must NOT consume
  // a sequence number. The real ID is allocated in `create`.
  const id = await peekNextStudentId(req.tenantId);
  res.json({ admissionNumber: id });
}

export async function getById(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);

  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      enrollments: { include: { class: true } },
      guardians:   { include: { guardian: true } },
    },
  });

  const { balance } = await getStudentBalance(student.id);
  res.json({ student: { ...student, feeBalance: balance } });
}

export const updateStudentSchema = z.object({
  fullName:        z.string().min(2).optional(),
  admissionNumber: z.string().min(1).optional(),
  classId:         z.string().uuid().nullable().optional(),
  dateOfBirth:     z.coerce.date().optional(),
  gender:          z.string().optional(),
  nationality:     z.string().optional(),
  religion:        z.string().optional(),
  address:         z.string().optional(),
  email:           z.string().email().nullable().optional(),
  phone:           z.string().nullable().optional(),
  previousSchool:  z.string().nullable().optional(),
  sports:          z.string().nullable().optional(),
  clubs:           z.string().nullable().optional(),
  otherActivities: z.string().nullable().optional(),
  nhisNumber:      z.string().nullable().optional(),
  profilePicUrl:   z.string().url().nullable().optional().or(z.literal('')),
  active:          z.boolean().optional(),
});

export async function update(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);
  const { classId, ...data } = req.body;

  // If admissionNumber is being changed, keep it unique per school.
  if (data.admissionNumber) {
    const clash = await prisma.student.findFirst({
      where: {
        tenantId: req.tenantId,
        admissionNumber: data.admissionNumber,
        NOT: { id: req.params.id },
      },
    });
    if (clash) throw ApiError.badRequest('Another student already uses that Student ID');
  }

  const student = await prisma.student.update({ where: { id: req.params.id }, data });

  // Class assignment: null clears it, a value (re)assigns the student.
  if (classId !== undefined) {
    if (classId) {
      const klass = await prisma.class.findFirst({ where: { id: classId, tenantId: req.tenantId } });
      if (!klass) throw ApiError.badRequest('Class not found in this school');
    }
    await prisma.enrollment.deleteMany({ where: { studentId: req.params.id } });
    if (classId) {
      await prisma.enrollment.create({ data: { studentId: req.params.id, classId } });
    }
  }

  const fresh = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: { enrollments: { include: { class: true } },
  } });
  res.json({ student: fresh });
}

export async function deactivate(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);
  const student = await prisma.student.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ student });
}

export const addGuardianSchema = z.object({
  fullName: z.string().min(2),
  phone:    z.string().min(6),
  email:    z.string().email().optional(),
  relation: z.string().optional(),
});

export async function addGuardian(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);
  const { fullName, phone, email, relation } = req.body;

  const guardian = await prisma.guardian.create({
    data: { tenantId: req.tenantId, fullName, phone, email },
  });
  await prisma.studentGuardian.create({
    data: { studentId: req.params.id, guardianId: guardian.id, relation },
  });

  res.status(201).json({ guardian });
}
