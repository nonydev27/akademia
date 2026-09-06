/**
 * controllers/communication.controller.js — list sent communications, retry failed sends.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendResultEmail, sendFeeReminderEmail } from '../services/email.service.js';
import { sendResultConfirmationSms, sendFeeReminderSms } from '../services/sms.service.js';

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
