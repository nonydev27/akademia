/**
 * controllers/term.controller.js — read academic years + terms for the tenant.
 * Terms are shown as labelled dropdowns so nobody pastes a UUID.
 *
 * Deliberately uses flat queries (no nested `include`) to keep the shapes simple.
 */

import prisma from '../config/db.js';

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
      id: true,
      label: true,
      startDate: true,
      endDate: true,
      academicYearId: true,
    },
  });

  res.json({
    terms: terms.map((t) => ({
      id: t.id,
      label: (yearLabel[t.academicYearId] || '') + ' - ' + t.label,
      termLabel: t.label,
      yearLabel: yearLabel[t.academicYearId] || '',
      startDate: t.startDate,
      endDate: t.endDate,
    })),
  });
}
