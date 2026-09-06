/**
 * services/audit.service.js — writes to the `audit_logs` table (PRD 10 & 11).
 *
 * A failed audit write must never block the primary action — log to winston
 * and swallow the error.
 */

import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export async function recordAudit({ tenantId, actorId, action, targetType, targetId, reason, metadata }) {
  try {
    await prisma.auditLog.create({
      data: { tenantId, actorId, action, targetType, targetId, reason, metadata },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { action, targetType, targetId, message: err.message });
  }
}
