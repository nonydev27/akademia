/**
 * controllers/student.controller.js — student CRUD, guardian linking, search.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getStudentBalance } from '../services/fee.service.js';

export const listQuerySchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function list(req, res) {
  const { search, classId, page, pageSize } = req.query;

  const where = {
    tenantId: req.tenantId,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { admissionNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(classId ? { enrollments: { some: { classId } } } : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { enrollments: { include: { class: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  res.json({ students, total, page, pageSize });
}

export const createStudentSchema = z.object({
  admissionNumber: z.string().min(1),
  fullName: z.string().min(2),
  dateOfBirth: z.coerce.date().optional(),
  email: z.string().email().optional(),
  classId: z.string().optional(),
});

export async function create(req, res) {
  const { admissionNumber, fullName, dateOfBirth, email, classId } = req.body;

  const existing = await prisma.student.findUnique({
    where: { tenantId_admissionNumber: { tenantId: req.tenantId, admissionNumber } },
  });
  if (existing) throw ApiError.badRequest('A student with that admission number already exists');

  const student = await prisma.student.create({
    data: {
      tenantId: req.tenantId,
      admissionNumber,
      fullName,
      dateOfBirth,
      email,
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

export async function getById(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);

  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      enrollments: { include: { class: true } },
      guardians: { include: { guardian: true } },
    },
  });

  const { balance } = await getStudentBalance(student.id);

  res.json({ student: { ...student, feeBalance: balance } });
}

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).optional(),
  dateOfBirth: z.coerce.date().optional(),
  email: z.string().email().nullable().optional(),
  active: z.boolean().optional(),
});

export async function update(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);
  const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body });
  res.json({ student });
}

export async function deactivate(req, res) {
  await findTenantStudent(req.tenantId, req.params.id);
  const student = await prisma.student.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ student });
}

export const addGuardianSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional(),
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
