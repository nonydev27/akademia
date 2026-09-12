/**
 * services/grade.service.js — multi-score aggregation formula.
 *
 * Three score types:
 *   caScore      — Continuous Assessment (class tests, quizzes, homework)  → 30%
 *   midtermScore — Mid-term / mid-semester examination                     → 20%
 *   examScore    — End-of-term / end-of-semester examination                 → 50%
 *
 * Partial scores are handled gracefully:
 *   - If only some scores are provided, the aggregate is computed from what's
 *     available, scaled to 100, so teachers can see progress.
 *   - The final grade on a report card should only be published once all three
 *     scores are present (enforced by the publish workflow, not here).
 *
 * Grade bands are configurable by admin via the GradeBand model.
 * If no bands are provided, fall back to sensible defaults.
 */

const DEFAULT_BANDS = [
  { letter: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
  { letter: 'B', minScore: 70, maxScore: 79.99, remark: 'Very Good' },
  { letter: 'C', minScore: 60, maxScore: 69.99, remark: 'Good' },
  { letter: 'D', minScore: 50, maxScore: 59.99, remark: 'Average' },
  { letter: 'E', minScore: 40, maxScore: 49.99, remark: 'Below Average' },
  { letter: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' },
];

export function computeAggregate({ caScore, midtermScore, examScore }) {
  if (caScore == null && midtermScore == null && examScore == null) return null;

  let weighted = 0;
  let totalWeight = 0;

  if (caScore != null) {
    weighted    += caScore * 0.30;
    totalWeight += 0.30;
  }
  if (midtermScore != null) {
    weighted    += midtermScore * 0.20;
    totalWeight += 0.20;
  }
  if (examScore != null) {
    weighted    += examScore * 0.50;
    totalWeight += 0.50;
  }

  const raw = totalWeight > 0 ? weighted / totalWeight : 0;
  return Math.round(raw * 100) / 100;
}

export function letterGrade(aggregate, bands = DEFAULT_BANDS) {
  if (aggregate == null) return null;
  const band = bands.find((b) => aggregate >= b.minScore && aggregate <= b.maxScore);
  return band?.letter ?? 'F';
}

export function gradeRemark(aggregate, bands = DEFAULT_BANDS) {
  if (aggregate == null) return '';
  const band = bands.find((b) => aggregate >= b.minScore && aggregate <= b.maxScore);
  return band?.remark ?? 'Fail';
}

export async function getGradeBands(tenantId) {
  const bands = await prisma.gradeBand.findMany({
    where: { tenantId },
    orderBy: { minScore: 'asc' },
  });
  return bands.length > 0 ? bands : DEFAULT_BANDS;
}

export async function setGradeBands(tenantId, bands) {
  await prisma.gradeBand.deleteMany({ where: { tenantId } });
  if (bands && bands.length) {
    await prisma.gradeBand.createMany({
      data: bands.map((b) => ({
        tenantId,
        letter: b.letter,
        minScore: b.minScore,
        maxScore: b.maxScore,
        remark: b.remark,
      })),
    });
  }
  return getGradeBands(tenantId);
}
