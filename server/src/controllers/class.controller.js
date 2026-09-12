/**
 * controllers/class.controller.js
 *
 * School Admin manages classes. A class has a human-facing Class ID (code),
 * e.g. "JHS2-A", which is what admins and teachers type — never a UUID.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { deriveClassCode } from '../services/code.service.js';

export const createClassSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20).optional(),
});

export async function create(req, res) {
  const { name } = req.body;
  const code = (req.body.code?.trim() || deriveClassCode(name)).toUpperCase();

  const clash = await prisma.class.findFirst({ where: { tenantId: req.tenantId, code } });
  if (clash) throw ApiError.badRequest('A class with that Class ID already exists');

  const klass = await prisma.class.create({
    data: { tenantId: req.tenantId, name, code },
  });
  res.status(201).json({ class: klass });
}

export async function list(req, res) {
  const classes = await prisma.class.findMany({
    where: { tenantId: req.tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  });
  res.json({ classes });
}

export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
});

export async function update(req, res) {
  const { id } = req.params;
  const klass = await prisma.class.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!klass) throw ApiError.notFound('Class not found');

  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.code) {
    data.code = req.body.code.trim().toUpperCase();
    const clash = await prisma.class.findFirst({
      where: { tenantId: req.tenantId, code: data.code, NOT: { id } },
    });
    if (clash) throw ApiError.badRequest('Another class already uses that Class ID');
  }

  const updated = await prisma.class.update({ where: { id }, data });
  res.json({ class: updated });
}

export async function remove(req, res) {
  const { id } = req.params;
  const klass = await prisma.class.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!klass) throw ApiError.notFound('Class not found');

  const enrolled = await prisma.enrollment.count({ where: { classId: id } });
  if (enrolled > 0) {
    throw ApiError.badRequest(
      `This class still has ${enrolled} student(s). Move them to another class first.`
    );
  }

  await prisma.class.delete({ where: { id } });
  res.json({ message: 'Class deleted' });
}
