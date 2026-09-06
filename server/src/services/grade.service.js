/**
 * services/grade.service.js — aggregation formula for CA + exam scores.
 *
 * Kept isolated so a tenant-configurable formula can replace this default
 * later (PRD section 14 "Academic revisions") without touching controllers.
 * Default: CA is 30% of the total, exam is 70%, both out of 100.
 */

const CA_WEIGHT = 0.3;
const EXAM_WEIGHT = 0.7;

export function computeAggregate({ caScore, examScore }) {
  if (caScore == null || examScore == null) return null;
  return Math.round((caScore * CA_WEIGHT + examScore * EXAM_WEIGHT) * 100) / 100;
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
