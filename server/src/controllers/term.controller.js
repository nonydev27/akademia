/**
 * controllers/term.controller.js — read + manage academic years + terms.
 *
 * Terms are shown as labelled dropdowns so nobody pastes a UUID.
 * Admins create, edit, and activate/deactivate terms.
 * Only one term can be ACTIVE at a time.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const termStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'UPCOMING']);

export const listTermsSchema = z.object({});

export async function listTerms(req, res) {
  const years = await prisma.academicYear.findMany({
    where: { tenantId: req.tenantId },
    select: { id: true, label: true },
  });

  const yearLabel = {};
  years.forEach((y) => { yearLabel[y.id] = y.label; });

  const yearIds = years.map((y) => y.id);

  const terms = await prisma.term.findMany({
    where: { academicYearId: { in: yearIds } },
    orderBy: { startDate: 'asc' },
    select: {
      id: true, label: true, status: true,
      startDate: true, endDate: true, academicYearId: true,
    },
  });

  res.json({
    academicYears: years.map((y) => ({ id: y.id, label: y.label })),
    terms: terms.map((t) => ({
      id: t.id,
      label: (yearLabel[t.academicYearId] || '') + ' - ' + t.label,
      academicYearId: t.academicYearId,
      termLabel: t.label,
      yearLabel: yearLabel[t.academicYearId] || '',
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
    })),
  });
}

export const createTermSchema = z.object({
  academicYearId: z.string(),
  label: z.string().min(1),
  status: termStatusSchema.optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function createTerm(req, res) {
  const { academicYearId, label, status = 'UPCOMING', startDate, endDate } = req.body;

  const year = await prisma.academicYear.findFirst({
    where: { id: academicYearId, tenantId: req.tenantId },
  });
  if (!year) throw ApiError.notFound('Academic year not found');

  if (status === 'ACTIVE') {
    await prisma.term.updateMany({
      where: { tenantId: req.tenantId, status: 'ACTIVE' },
      data: { status: 'INACTIVE' },
    });
  }

  const term = await prisma.term.create({
    data: { academicYearId, label, status, startDate, endDate, tenantId: req.tenantId },
  });

  res.status(201).json({ term });
}

export const updateTermSchema = z.object({
  label: z.string().min(1).optional(),
  status: termStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function updateTerm(req, res) {
  const { id } = req.params;
  const term = await prisma.term.findFirst({
    where: { id, tenantId: req.tenantId },
  });
  if (!term) throw ApiError.notFound('Term not found');

  const data = {};
  if (req.body.label !== undefined) data.label = req.body.label;
  if (req.body.status !== undefined) {
    if (req.body.status === 'ACTIVE') {
      await prisma.term.updateMany({
        where: { tenantId: req.tenantId, status: 'ACTIVE', NOT: { id } },
        data: { status: 'INACTIVE' },
      });
    }
    data.status = req.body.status;
  }
  if (req.body.startDate !== undefined) data.startDate = req.body.startDate;
  if (req.body.endDate !== undefined) data.endDate = req.body.endDate;

  const updated = await prisma.term.update({ where: { id }, data });
  res.json({ term: updated });
}

export async function deleteTerm(req, res) {
  const { id } = req.params;
  const term = await prisma.term.findFirst({
    where: { id, tenantId: req.tenantId },
  });
  if (!term) throw ApiError.notFound('Term not found');

  const gradeCount = await prisma.grade.count({ where: { termId: id } });
  if (gradeCount > 0) {
    throw ApiError.badRequest('Cannot delete a term that has grades recorded. Deactivate it instead.');
  }

  await prisma.term.delete({ where: { id } });
  res.json({ message: 'Term deleted' });
}
