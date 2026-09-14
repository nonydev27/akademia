/**
 * controllers/fee.controller.js — fee structures, payments, balances, overrides.
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getStudentBalance, recordPayment, setFeeStructureCharge } from '../services/fee.service.js';
import { recordAudit } from '../services/audit.service.js';

async function assertTenantStudent(tenantId, studentId) {
  const student = await prisma.student.findFirst({ where: { id: studentId, tenantId } });
  if (!student) throw ApiError.notFound('Student not found');
  return student;
}

export const createStructureSchema = z.object({
  termId: z.string(),
  amount: z.number().positive(),
  label: z.string().min(2),
  classId: z.string().optional(),
});

export async function createStructure(req, res) {
  const { termId, amount, label, classId } = req.body;

  const structure = await prisma.feeStructure.create({
    data: { tenantId: req.tenantId, termId, amount, label },
  });

  if (classId) {
    const studentIds = (
      await prisma.enrollment.findMany({ where: { classId, class: { tenantId: req.tenantId } } })
    ).map((e) => e.studentId);
    await Promise.all(studentIds.map((studentId) => setFeeStructureCharge(studentId, amount)));
  }

  res.status(201).json({ structure });
}

export async function getStudentAccount(req, res) {
  await assertTenantStudent(req.tenantId, req.params.id);
  const { account, balance } = await getStudentBalance(req.params.id);
  res.json({ account, balance });
}

export const recordPaymentSchema = z.object({
  studentId: z.string(),
  amount: z.number().positive(),
  reference: z.string().min(3),
  note: z.string().max(500).optional(),
});

export async function createPayment(req, res) {
  const { studentId, amount, reference, note } = req.body;
  await assertTenantStudent(req.tenantId, studentId);

  const existing = await prisma.payment.findUnique({ where: { reference } });
  if (existing) throw ApiError.badRequest('A payment with that reference already exists');

  const { payment, balance } = await recordPayment({ studentId, amount, reference, note });
  res.status(201).json({ payment, balance });
}

export async function outstanding(req, res) {
  const accounts = await prisma.studentFeeAccount.findMany({
    where: { student: { tenantId: req.tenantId } },
    include: { student: true, payments: true },
  });

  const withBalance = accounts
    .map((a) => {
      const validatedPaid = a.payments.filter((p) => p.validated).reduce((s, p) => s + p.amount, 0);
      const balance = Math.max(a.totalCharged - validatedPaid, 0);
      return { student: a.student, balance };
    })
    .filter((a) => a.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  res.json({ students: withBalance });
}

export const overrideSchema = z.object({
  reason: z.string().min(5, 'A reason is required for a fee override'),
});

export async function override(req, res) {
  const studentId = req.params.id;
  await assertTenantStudent(req.tenantId, studentId);
  const { reason } = req.body;

  const { balance: previousBalance } = await getStudentBalance(studentId);
  const account = await setFeeStructureCharge(studentId, 0);

  await recordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: 'FEE_OVERRIDE',
    targetType: 'Student',
    targetId: studentId,
    reason,
    metadata: { previousBalance },
  });

  res.json({ message: 'Fee lock overridden for this student', account });
}
