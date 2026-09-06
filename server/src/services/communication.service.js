/**
 * services/communication.service.js — shared delivery log for email + SMS.
 *
 * Both email.service.js and sms.service.js call logCommunication() after
 * every send attempt so communication.controller.js has one place to read
 * delivery status and retry from.
 */

import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export async function logCommunication({ tenantId, channel, recipient, templateKey, status, providerResponse, payload }) {
  try {
    return await prisma.communication.create({
      data: { tenantId, channel, recipient, templateKey, status, providerResponse, payload },
    });
  } catch (err) {
    logger.error('Failed to log communication', { channel, recipient, templateKey, message: err.message });
    return null;
  }
}
