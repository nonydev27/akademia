/**
 * services/fee.service.js — fee balance calculation (PRD section 6).
 *
 * Authoritative formula: Outstanding Balance = Total Term Fees - Validated Payments.
 * Only validated payments reduce the balance used by the result-release gate.
 */

import prisma from '../config/db.js';

export function computeBalance(account) {
  if (!account) return 0;
  const validatedPaid = (account.payments || [])
    .filter((p) => p.validated)
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.max(account.totalCharged - validatedPaid, 0);
}

export async function getOrCreateFeeAccount(studentId) {
  let account = await prisma.studentFeeAccount.findUnique({
    where: { studentId },
    include: { payments: true },
  });
  if (!account) {
    account = await prisma.studentFeeAccount.create({
      data: { studentId },
      include: { payments: true },
    });
  }
  return account;
}

export async function getStudentBalance(studentId) {
  const account = await getOrCreateFeeAccount(studentId);
  return {
    account,
    balance: computeBalance(account),
  };
}

export async function recordPayment({ studentId, amount, reference }) {
  return prisma.$transaction(async (tx) => {
    let account = await tx.studentFeeAccount.findUnique({ where: { studentId } });
    if (!account) {
      account = await tx.studentFeeAccount.create({ data: { studentId } });
    }

    const payment = await tx.payment.create({
      data: { accountId: account.id, amount, reference, validated: true },
    });

    const updatedAccount = await tx.studentFeeAccount.update({
      where: { id: account.id },
      data: { totalPaid: { increment: amount } },
      include: { payments: true },
    });

    return { payment, balance: computeBalance(updatedAccount) };
  });
}

export async function setFeeStructureCharge(studentId, totalCharged) {
  return prisma.studentFeeAccount.upsert({
    where: { studentId },
    create: { studentId, totalCharged },
    update: { totalCharged },
  });
}
