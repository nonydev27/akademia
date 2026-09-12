/**
 * controllers/gradeBand.controller.js — configurable grade scales.
 *
 * Admins define which score ranges map to which letters and remarks.
 * e.g. 80-100 = A "Excellent", 70-79 = B "Very Good", etc.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const gradeBandSchema = z.object({
  letter:  z.string().length(1),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
  remark:  z.string().min(1),
});

export async function listBands(req, res) {
  const bands = await prisma.gradeBand.findMany({
    where: { tenantId: req.tenantId },
    orderBy: { minScore: 'asc' },
  });
  res.json({ bands });
}

export const createBandsSchema = z.array(gradeBandSchema).min(1).max(20);

export async function setBands(req, res) {
  const bands = req.body;

  const validated = bands.map((b) => ({
    tenantId: req.tenantId,
    letter: b.letter.toUpperCase(),
    minScore: b.minScore,
    maxScore: b.maxScore,
    remark: b.remark,
  }));

  await prisma.gradeBand.deleteMany({ where: { tenantId: req.tenantId } });
  await prisma.gradeBand.createMany({ data: validated });

  const result = await prisma.gradeBand.findMany({
    where: { tenantId: req.tenantId },
    orderBy: { minScore: 'asc' },
  });

  res.json({ bands: result });
}

export async function deleteBand(req, res) {
  const { id } = req.params;
  const band = await prisma.gradeBand.findFirst({
    where: { id, tenantId: req.tenantId },
  });
  if (!band) throw ApiError.notFound('Grade band not found');

  await prisma.gradeBand.delete({ where: { id } });
  res.json({ message: 'Grade band deleted' });
}
