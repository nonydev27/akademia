/**
 * services/code.service.js
 *
 * Human-facing code generation for Akademia.
 *
 * Every table still uses an internal UUID primary key (never shown to users).
 * These helpers produce the IDs that admins and teachers actually type and see:
 *   - School code  : initials of the school name,  e.g. "Vilaworld International School" -> "VIS"
 *   - Student ID    : school code + zero-padded sequence, e.g. "VIS-001"
 *   - Class code    : admin-supplied, e.g. "JHS2-A"
 *   - Subject code  : admin-supplied, e.g. "ENGLP2"
 */

import prisma from "../config/db.js";

const STOP_WORDS = new Set(["the", "of", "and", "&"]);

/** Derive initials from a school name: "Vilaworld International School" -> "VIS". */
export function deriveSchoolCode(name = "") {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));

  const initials = words.map((w) => w[0].toUpperCase()).join("");
  const code = (initials || "SCH").slice(0, 6);
  return code;
}

/**
 * Pick a school code that is unique in the Tenant table.
 * If the initials are taken, append a short numeric suffix (VIS, VIS2, VIS3…).
 * If a preferred code is supplied and free, it is used as-is.
 */
export async function uniqueSchoolCode(preferred, fallbackName) {
  const base = (
    preferred?.trim() || deriveSchoolCode(fallbackName)
  ).toUpperCase();
  let candidate = base;
  let n = 1;
  // Loop until a free code is found.
  // (Unique index on Tenant.code is the final guard.)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.tenant.findUnique({
      where: { code: candidate },
    });
    if (!clash) return candidate;
    n += 1;
    candidate = `${base}${n}`;
  }
}

/** Build a class code from a class name if the admin did not supply one. */
export function deriveClassCode(name = "") {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "CLASS";
}

/**
 * Atomically reserve the next student number for a school and return the
 * formatted student ID, e.g. "VIS-001".
 *
 * Uses an atomic UPDATE … RETURNING on the tenant's running counter, so two
 * concurrent admissions can never receive the same number.
 */
export async function nextStudentId(tenantId) {
  const rows = await prisma.$queryRaw`
    UPDATE "Tenant"
    SET "studentSeq" = "studentSeq" + 1
    WHERE "id" = ${tenantId}
    RETURNING "code", "studentSeq"
  `;
  const row = rows[0];
  if (!row) throw new Error("Tenant not found while generating student ID");
  const padded = String(row.studentSeq).padStart(3, "0");
  return `${row.code}-${padded}`;
}
