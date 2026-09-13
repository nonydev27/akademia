/**
 * services/grade.service.js — grade aggregation formula.
 *
 * Two score types:
 *   caScore   — Continuous Assessment (class tests, quizzes, homework) → 30%
 *   examScore — End-of-term / end-of-semester examination               → 70%
 *
 * Both caScore and examScore are required; if either is missing the
 * aggregate returns null so incomplete grades are never published.
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
  if (caScore == null || examScore == null) return null;
  return Math.round((caScore * 0.30 + examScore * 0.70) * 100) / 100;
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
