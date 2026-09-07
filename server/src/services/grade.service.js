/**
 * services/grade.service.js — multi-score aggregation formula.
 *
 * Three score types:
 *   caScore      — Continuous Assessment (class tests, quizzes, homework)  → 30%
 *   midtermScore — Mid-term / mid-semester examination                     → 20%
 *   examScore    — End-of-term / end-of-semester examination               → 50%
 *
 * Partial scores are handled gracefully:
 *   - If only some scores are provided, the aggregate is computed from what's
 *     available, scaled to 100, so teachers can see progress.
 *   - The final grade on a report card should only be published once all three
 *     scores are present (enforced by the publish workflow, not here).
 */

export function computeAggregate({ caScore, midtermScore, examScore }) {
  // If none are provided, no aggregate yet
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

  // Scale to 100 so partial entry still shows meaningful progress
  const raw = totalWeight > 0 ? weighted / totalWeight : 0;
  return Math.round(raw * 100) / 100;
}

export function letterGrade(aggregate) {
  if (aggregate == null) return null;
  if (aggregate >= 80) return 'A';
  if (aggregate >= 70) return 'B';
  if (aggregate >= 60) return 'C';
  if (aggregate >= 50) return 'D';
  if (aggregate >= 40) return 'E';
  return 'F';
}

export function gradeRemark(aggregate) {
  if (aggregate == null) return '';
  if (aggregate >= 80) return 'Excellent';
  if (aggregate >= 70) return 'Very Good';
  if (aggregate >= 60) return 'Good';
  if (aggregate >= 50) return 'Average';
  if (aggregate >= 40) return 'Below Average';
  return 'Fail';
}
