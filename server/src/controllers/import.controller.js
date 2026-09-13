/**
 * controllers/import.controller.js — AI-assisted bulk import of student
 * records (and optional grades) from an uploaded document.
 *
 * Two-step flow so nothing is written until the user confirms:
 *   1. POST /students/import/preview  → parse the document, return a preview.
 *   2. POST /students/import/commit   → create the confirmed students.
 *
 * Available to SCHOOL_ADMIN and STAFF (feature-gated by `aiImport`).
 */

import { z } from 'zod';
import prisma from '../config/db.js';
import { parseStudentDocument } from '../services/aiImport.service.js';
import { nextStudentId } from '../services/code.service.js';

export const previewSchema = z.object({
  fileData: z.string().min(10),      // data URL or raw base64
  fileName: z.string().min(1),
});

export async function preview(req, res) {
  const { fileData, fileName } = req.body;
  const result = await parseStudentDocument({ fileData, fileName, tenantId: req.tenantId });

  // Enrich each parsed student with a class match (by name/code) so the client
  // can show which class the student will be placed into.
  const classes = await prisma.class.findMany({
    where: { tenantId: req.tenantId },
    select: { id: true, name: true, code: true },
  });
  const byKey = new Map();
  for (const c of classes) {
    byKey.set(classKey(c.name), c);
    byKey.set(classKey(c.code), c);
  }

  const students = result.students.map((s, i) => {
    const match = s.className ? byKey.get(classKey(s.className)) : null;
    return {
      rowNumber: i + 2, // header is row 1
      fullName: s.fullName,
      admissionNumber: s.admissionNumber || null,
      gender: s.gender || null,
      dateOfBirth: s.dateOfBirth || null,
      className: s.className || null,
      classId: match?.id || null,
      classMatched: !!match,
      grades: s.grades || {},
    };
  });

  res.json({
    students,
    classes,
    rowCount: result.rowCount,
    source: result.source,
    truncated: !!result.truncated,
    warning: result.warning || null,
  });
}

export const commitSchema = z.object({
  students: z.array(z.object({
    fullName: z.string().min(2),
    admissionNumber: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    classId: z.string().uuid().optional().nullable(),
  })).min(1).max(1000),
});

export async function commit(req, res) {
  const { students } = req.body;

  // Validate any class ids belong to this school.
  const classIds = [...new Set(students.map((s) => s.classId).filter(Boolean))];
  let validClassIds = new Set();
  if (classIds.length) {
    const found = await prisma.class.findMany({
      where: { tenantId: req.tenantId, id: { in: classIds } },
      select: { id: true },
    });
    validClassIds = new Set(found.map((c) => c.id));
  }

  const created = [];
  const skipped = [];

  for (const s of students) {
    try {
      const admissionNumber =
        (s.admissionNumber && String(s.admissionNumber).trim()) || (await nextStudentId(req.tenantId));

      const clash = await prisma.student.findUnique({
        where: { tenantId_admissionNumber: { tenantId: req.tenantId, admissionNumber } },
      });
      if (clash) { skipped.push({ fullName: s.fullName, reason: 'Student ID already exists' }); continue; }

      const dob = s.dateOfBirth ? parseDate(s.dateOfBirth) : null;

      const data = {
        tenantId: req.tenantId,
        admissionNumber,
        fullName: s.fullName,
        gender: s.gender || null,
        dateOfBirth: dob || undefined,
      };
      if (s.classId && validClassIds.has(s.classId)) {
        data.enrollments = { create: { classId: s.classId }};
      }

      const student = await prisma.student.create({ data });
      created.push({ id: student.id, fullName: student.fullName, admissionNumber: student.admissionNumber });
    } catch (err) {
      skipped.push({ fullName: s.fullName, reason: err.message || 'Failed to create' });
    }
  }

  res.status(201).json({
    created,
    skipped,
    createdCount: created.length,
    skippedCount: skipped.length,
  });
}

/**
 * Normalise a class name/code for matching.
 *
 * Collapses internal runs of whitespace and trims the ends, so real-world data
 * like "SCIENCE 1-A " still matches a spreadsheet's "SCIENCE 1-A". Without the
 * trailing-space trim those rows silently fall through to "Unmatched".
 */
function classKey(value) {
  return String(value || '').replace(/\s+/g, " ").trim().toLowerCase();
}

/** Accepts ISO dates and common dd/mm/yyyy or yyyy-mm-dd forms. Returns a Date or null. */
function parseDate(value) {
  const s = String(value).trim();
  if (!s) return null;
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);

  const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,})$/.exec(s);
  if (m) {
    let [, a, b, y] = m;
    let day = parseInt(a, 10), month = parseInt(b, 10);
    // Heuristic: if first part > 12 it's a day; else assume dd/mm.
    if (month > 12 && day <= 12) { [day, month] = [month, day]; }
    let year = parseInt(y, 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}
