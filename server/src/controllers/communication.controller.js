/**
 * controllers/communication.controller.js — list sent communications,
 * retry failed sends, and compose new multi-recipient sends.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendResultEmail, sendFeeReminderEmail, sendAdminNotification } from '../services/email.service.js';
import { sendResultConfirmationSms, sendFeeReminderSms } from '../services/sms.service.js';
import logger from '../utils/logger.js';

const EMAIL_TEMPLATE_KEYS = new Set(['RESULT_RELEASED', 'FEE_REMINDER', 'SUBSCRIPTION_RENEWED', 'TEACHER_WELCOME', 'PASSWORD_RESET']);

export const listQuerySchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']).optional(),
  status: z.enum(['SENT', 'FAILED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function list(req, res) {
  const { channel, status, page, pageSize } = req.query;

  const where = { tenantId: req.tenantId, ...(channel ? { channel } : {}), ...(status ? { status } : {}) };

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.communication.count({ where }),
  ]);

  res.json({ communications, total, page, pageSize });
}

export async function retry(req, res) {
  const record = await prisma.communication.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
  if (!record) throw ApiError.notFound('Communication not found');
  if (record.status !== 'FAILED') throw ApiError.badRequest('Only failed communications can be retried');

  const payload = record.payload || {};

  if (record.channel === 'EMAIL') {
    if (record.templateKey === 'RESULT_RELEASED') {
      throw ApiError.badRequest('Result emails must be retried by re-publishing the report card (a PDF is required)');
    }
    await sendFeeReminderEmail({
      tenantId: req.tenantId,
      to: record.recipient,
      studentName: payload.studentName || '',
      balance: payload.balance || 0,
      termLabel: payload.termLabel || '',
    });
  } else if (record.channel === 'SMS') {
    if (record.templateKey === 'RESULT_RELEASED') {
      await sendResultConfirmationSms({ tenantId: req.tenantId, to: record.recipient, studentName: payload.studentName || '' });
    } else {
      await sendFeeReminderSms({ tenantId: req.tenantId, to: record.recipient, studentName: payload.studentName || '', balance: payload.balance || 0 });
    }
  }

  res.json({ message: 'Retry attempted, check the communications log for the outcome' });
}

export const sendSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']),
  recipients: z.array(z.string().min(1)).min(1).max(200),
  subject: z.string().min(1).max(200).optional(),
  templateKey: z.string().optional(),
  message: z.string().min(1).max(5000).optional(),
  data: z.record(z.unknown()).optional(),
});

export async function send(req, res) {
  const { channel, recipients, subject, templateKey, message, data } = req.body;

  if (channel === 'EMAIL' && !subject) throw ApiError.badRequest('Subject is required for EMAIL channel');
  if (message && message.length > 5000) throw ApiError.badRequest('Message too long (max 5000 characters)');

  const results = await Promise.allSettled(
    recipients.map((recipient) => {
      if (channel === 'EMAIL') {
        return sendAdminNotification({
          tenantId: req.tenantId,
          to: [recipient],
          subject: subject || `Akademia Notification`,
          templateKey: templateKey || 'GENERIC',
          data: {
            ...(data || {}),
            message: message || '',
            recipient,
          },
        }).catch((err) => { logger.warn('Bulk email send failed', { recipient, message: err.message }); return { status: 'rejected', reason: err }; });
      }
      return prisma.communication.create({
        data: {
          tenantId: req.tenantId,
          channel: 'SMS',
          recipient,
          templateKey: templateKey || 'GENERIC',
          status: 'SENT',
          providerResponse: 'Queued via bulk send',
          payload: { message, ...(data || {}) },
        },
      });
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  const successes = results.filter((r) => r.status === 'fulfilled');

  if (channel === 'EMAIL') {
    for (const recipient of recipients) {
      await prisma.communication.create({
        data: {
          tenantId: req.tenantId,
          channel: 'EMAIL',
          recipient,
          templateKey: templateKey || 'GENERIC',
          status: failures.some((f) => f.reason?.message?.includes(recipient)) ? 'FAILED' : 'SENT',
          providerResponse: failures.length > 0 ? `${failures.length} of ${recipients.length} failed` : 'Sent via bulk',
          payload: { subject, message, ...(data || {}) },
        },
      });
    }
  }

  res.json({
    message: `Communication sent to ${successes.length}/${recipients.length} recipients`,
    total: recipients.length,
    successes: successes.length,
    failures: failures.length,
  });
}
