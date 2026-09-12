/**
 * controllers/subject.controller.js
 *
 * School Admin manages subjects (code + name).
 * Teachers set/reset the PIN for their own assigned subjects.
 * PIN is stored as a bcrypt-style hash via a simple SHA-256 — since this is
 * a low-stakes 4-digit access code we use a fast hash with a salt stored
 * alongside it in the DB. For true security upgrade to bcrypt.
 */

import { z } from 'zod';
import crypto from 'node:crypto';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// ─── Admin: list all subjects ────────────────────────────────────────────────
export async function listSubjects(req, res) {
  const subjects = await prisma.subject.findMany({
    where:   { tenantId: req.tenantId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, pin: true },
  });
  // Don't expose raw hash — just indicate if pin is set
  res.json({ subjects: subjects.map((s) => ({ ...s, pinSet: !!s.pin, pin: undefined })) });
}

// Teacher: list subjects assigned to me (with pin status).
// Powers the teacher portal so a subject teacher can see their own subjects and
// set/reset the access PIN for each without ever seeing another teacher's data.
export async function listMySubjects(req, res) {
  if (req.user.role === 'SCHOOL_ADMIN') {
    // Admins oversee everything — return all subjects with pin status.
    const subjects = await prisma.subject.findMany({
      where:   { tenantId: req.tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, pin: true },
    });
    return res.json({
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code, pinSet: !!s.pin, classes: [] })),
    });
  }

  const assignments = await prisma.teacherClassSubject.findMany({
    where: { teacherId: req.user.id, subject: { tenantId: req.tenantId } },
    include: {
      subject: { select: { id: true, name: true, code: true, pin: true } },
      class:   { select: { id: true, name: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  });

  // Group assignments by subject so each subject appears once with its classes.
  const bySubject = new Map();
  for (const a of assignments) {
    const key = a.subject.id;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        id: a.subject.id, name: a.subject.name, code: a.subject.code,
        pinSet: !!a.subject.pin, classes: [],
      });
    }
    bySubject.get(key).classes.push({ id: a.class.id, name: a.class.name });
  }

  res.json({ subjects: [...bySubject.values()] });
}

// Teacher: set / reset my subject PIN (self-service). A teacher may set or
// reset the PIN for any subject they are assigned to. This is the
// "reset PIN if forgotten" path from the portal.
export const resetMyPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export async function resetMyPin(req, res) {
  const { id } = req.params;
  const { pin } = req.body;

  const subject = await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');

  if (req.user.role !== 'SCHOOL_ADMIN') {
    const assignment = await prisma.teacherClassSubject.findFirst({
      where: { subjectId: id, teacherId: req.user.id },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this subject');
  }

  await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin), pinOwnerId: req.user.id } });
  res.json({ message: 'PIN updated successfully' });
}

// ─── Admin: create subject ───────────────────────────────────────────────────
export const createSubjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20).toUpperCase(),
});

export async function createSubject(req, res) {
  const { name, code } = req.body;

  const existing = await prisma.subject.findUnique({
    where: { tenantId_code: { tenantId: req.tenantId, code } },
  });
  if (existing) throw ApiError.badRequest('A subject with that code already exists');

  const subject = await prisma.subject.create({
    data: { tenantId: req.tenantId, name, code },
  });

  res.status(201).json({ subject: { id: subject.id, name: subject.name, code: subject.code, pinSet: false } });
}

// ─── Admin: update subject name/code ────────────────────────────────────────
export const updateSubjectSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(20).optional(),
});

export async function updateSubject(req, res) {
  const { id } = req.params;
  const subject = await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');

  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.code) data.code = req.body.code.toUpperCase();

  const updated = await prisma.subject.update({ where: { id }, data });
  res.json({ subject: { id: updated.id, name: updated.name, code: updated.code, pinSet: !!updated.pin } });
}

// ─── Admin: delete subject ───────────────────────────────────────────────────
export async function deleteSubject(req, res) {
  const { id } = req.params;
  const subject = await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');
  await prisma.subject.delete({ where: { id } });
  res.json({ message: 'Subject deleted' });
}

// ─── Teacher: set / reset PIN ────────────────────────────────────────────────
export const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export async function setPin(req, res) {
  const { id } = req.params;
  const { pin } = req.body;

  // Admin can set any PIN; a teacher may only set the PIN for a subject they teach.
  if (req.user.role !== 'SCHOOL_ADMIN') {
    const assignment = await prisma.teacherClassSubject.findFirst({
      where: { subjectId: id, teacherId: req.user.id },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this subject');
  }

  // Verify subject belongs to same tenant
  const subject = await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');

  await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin), pinOwnerId: req.user.id } });
  res.json({ message: 'PIN updated successfully' });
}

export const verifyPinSchema = z.object({
  pin: z.string().length(4),
});

export async function verifyPin(req, res) {
  const { id } = req.params;
  const { pin } = req.body;

  const subject = await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId } });
  if (!subject) throw ApiError.notFound('Subject not found');
  if (!subject.pin) throw ApiError.badRequest('This subject has no PIN set. Contact the subject teacher.');

  const match = subject.pin === hashPin(pin);
  if (!match) throw ApiError.badRequest('Incorrect PIN');

  res.json({ verified: true, subject: { id: subject.id, name: subject.name, code: subject.code } });
}
export const verifyByCodeSchema = z.object({
  code: z.string().min(2),
  pin:  z.string().length(4),
});

export async function verifyByCode(req, res) {
  const { code, pin } = req.body;

  const subject = await prisma.subject.findUnique({
    where: { tenantId_code: { tenantId: req.tenantId, code: code.toUpperCase() } },
  });
  if (!subject) throw ApiError.notFound('No subject found with that code');
  if (!subject.pin) throw ApiError.badRequest('This subject has no PIN set. Contact your administrator.');

  const match = subject.pin === hashPin(pin);
  if (!match) throw ApiError.badRequest('Incorrect PIN');

  // Also verify the requesting teacher is assigned to this subject (unless admin)
  if (req.user.role === 'STAFF') {
    const assignment = await prisma.teacherClassSubject.findFirst({
      where: { subjectId: subject.id, teacherId: req.user.id },
    });
    if (!assignment) throw ApiError.forbidden('You are not assigned to this subject');
  }

  res.json({ verified: true, subject: { id: subject.id, name: subject.name, code: subject.code } });
}
