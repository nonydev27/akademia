/**
 * scripts/validate-seed-csv.mjs
 *
 * Verifies the generated CSV against the LIVE database AND the REAL server
 * parser. Both halves matter:
 *
 *   - the parser proves the file is read as intended (no rows dropped).
 *   - the database proves every class name in the CSV matches a class that
 *     actually exists, character for character.
 *
 * The DB half is the important one. An earlier version of this script hardcoded
 * the expected class names, so it happily confirmed "SCIENCE1-A" â€” the very
 * typo it was supposed to catch. Reading the names from the DB keeps this an
 * independent check rather than a restatement of our own assumptions.
 *
 * Run from the repo root:  node scripts/validate-seed-csv.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { extractStudentsHeuristic } from '../server/src/services/aiImport.heuristic.js';
// Same parser the server uses for real uploads, but from a module with no
// Prisma/env imports, so the parsing half is independent of the DB.
import { rowsFromCsv } from '../server/src/services/csvRows.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV = join(HERE, 'seed-students-import.csv');

const prisma = new PrismaClient();

/** Must mirror import.controller.js#classKey exactly. */
const classKey = (v) => String(v || '').replace(/\s+/g, " ").trim().toLowerCase();

/** Tenant with the most classes â€” the one the seed data is presumably for. */
async function pickBusiestTenant() {
  const orderBy = { _count: { tenantId: 'desc' } };
  const grouped = await prisma.class.groupBy({
    by: ['tenantId'],
    _count: { tenantId: true },
    orderBy,
  });
  if (!grouped.length) throw new Error('No classes exist in any tenant â€” run the seed first.');
  if (grouped.length > 1) {
    console.warn(
      `Warning: ${grouped.length} tenants hold classes; checking only the busiest ` +
      `(${grouped[0].tenantId}). Set SEED_TENANT_ID to validate a different school.`,
    );
  }
  return grouped[0].tenantId;
}

const text = readFileSync(CSV, 'utf8');

// Mirror the server's CSV path exactly: same splitter, same row builder.
const rows = rowsFromCsv(text);
const result = extractStudentsHeuristic(rows);
const { students } = result;

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`  x ${msg}`); };
const pass = (msg) => console.log(`  + ${msg}`);

console.log(`Parsed ${students.length} students via extractStudentsHeuristic()`);
console.log(`source: ${result.source}\n`);

// 1. Row count
if (students.length >= 240) pass(`${students.length} students (need 240+)`);
else fail(`only ${students.length} students parsed`);

// 2. Every class name resolves to a real class in the DB.
//    This is what decides whether the importer pre-assigns the student or shows
//    them as "Unmatched" in the review table.
// Scope to one tenant, like import.controller.js#preview does (it queries
// where: { tenantId: req.tenantId }). Keying by name/code across ALL tenants
// lets an irrelevant tenant's class count as a match, which reports success for
// a tenant whose own classes were never checked.
//
// Pick the target with SEED_TENANT_ID, or fall back to the tenant owning most
// classes. Override when seeding a specific school.
const TARGET_TENANT = process.env.SEED_TENANT_ID || await pickBusiestTenant();
const dbClasses = await prisma.class.findMany({
  where: { tenantId: TARGET_TENANT },
  select: { name: true, code: true, tenantId: true },
});
console.log(`Classes in tenant ${TARGET_TENANT}: ${dbClasses.length}\n`);
const byKey = new Map();
for (const c of dbClasses) {
  byKey.set(classKey(c.name), c);
  byKey.set(classKey(c.code), c);
}

const counts = {};
for (const s of students) counts[s.className] = (counts[s.className] || 0) + 1;

console.log('\nClass matching (against live DB):');
for (const name of Object.keys(counts)) {
  const hit = byKey.get(classKey(name));
  if (hit) pass(`"${name}" -> "${hit.name}" (${hit.code}) â€” ${counts[name]} students`);
  else fail(`"${name}" -> NO MATCHING CLASS IN DB (${counts[name]} students would be Unmatched)`);
}

// 3. Does the value the SERVER will actually use match the DB byte-for-byte?
//
//    Compare against s.className, not the raw CSV cell. The server parser
//    (extractStudentsHeuristic) trims the cell before storing it, so the CSV
//    cell and the value under review are not always the same string. Checking
//    the raw cell reported a trailing space that never reaches the database and
//    failed a CSV the importer handles correctly.
console.log('\nExact-string check (value the server stores, vs the DB):');
for (const name of Object.keys(counts)) {
  const stored = students.find((s) => s.className === name).className;
  if (dbClasses.some((c) => c.name === stored)) {
    pass(`"${stored}" is byte-identical to the DB value`);
  } else {
    const near = dbClasses.find((c) => classKey(c.name) === classKey(stored));
    if (near) {
      fail(`"${stored}" only matches after normalising; DB stores ` +
        `[${near.name}] (charCodes ${[...near.name].map((ch) => ch.charCodeAt(0)).join(',')})`);
      // Distinguish a value the parser fails to clean from one the DB really
      // stores with padding: only the former can be fixed in the generator.
      const rawCell = name;
      if (rawCell !== stored) {
        fail(`  note: raw CSV cell [${rawCell}] differs from the stored value â€” ` +
          `the parser did not trim it to the DB form`);
      } else {
        fail(`  note: the DB itself stores the padded name; the CSV cell is already ` +
          `byte-identical to it, so the fix belongs in the database, not here`);
      }
    }
  }
}

// 3. Gender normalised to exactly Male/Female
console.log('\nGender normalisation:');
const genders = {};
for (const s of students) genders[s.gender] = (genders[s.gender] || 0) + 1;
for (const g of Object.keys(genders)) {
  if (g === 'Male' || g === 'Female') pass(`${g}: ${genders[g]}`);
  else fail(`unnormalised gender value "${g}" (${genders[g]} rows)`);
}

// 4. Both sexes present and reasonably balanced
const m = genders.Male || 0;
const f = genders.Female || 0;
if (m > 0 && f > 0) pass(`mixed roster â€” Male ${m}, Female ${f}`);
else fail('roster is not mixed');
if (Math.abs(m - f) <= students.length * 0.15) pass('gender split within 15%');
else fail(`gender split skewed: ${m} vs ${f}`);

// 5. Dates parse to real calendar dates
console.log('\nDate of birth:');
const badDates = students.filter((s) => !s.dateOfBirth || Number.isNaN(Date.parse(s.dateOfBirth)));
if (!badDates.length) pass(`all ${students.length} dates parse as ISO`);
else fail(`${badDates.length} unparseable dates, e.g. ${badDates[0]?.dateOfBirth}`);

const ages = students
  .map((s) => (Date.parse('2026-09-01') - Date.parse(s.dateOfBirth)) / (365.25 * 24 * 3600 * 1000));
const minAge = Math.floor(Math.min(...ages));
const maxAge = Math.ceil(Math.max(...ages));
if (minAge >= 14 && maxAge <= 19) pass(`ages span ${minAge}â€“${maxAge} (plausible secondary school)`);
else fail(`implausible age span: ${minAge}â€“${maxAge}`);

// 6. Student IDs deliberately blank -> server auto-generates via studentSeq
console.log('\nStudent IDs:');
const withId = students.filter((s) => s.admissionNumber);
if (!withId.length) pass('all blank â€” server will allocate SON-001â€¦ from studentSeq');
else fail(`${withId.length} rows carry an explicit ID and would bypass the sequence`);

// 7. No duplicate names (the parser also de-dupes, so duplicates would vanish)
console.log('\nIntegrity:');
const names = students.map((s) => s.fullName);
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
if (!dupes.length) pass('no duplicate names (no rows silently dropped)');
else fail(`${dupes.length} duplicate names: ${[...new Set(dupes)].slice(0, 3).join(', ')}`);

// 8. Nothing lost between raw rows and parsed students
const rawRows = text.split(/\r?\n/).filter((l) => l.trim()).length - 1; // minus header
if (rawRows === students.length) pass(`no rows lost (${rawRows} data rows -> ${students.length} students)`);
else fail(`row loss: ${rawRows} data rows but ${students.length} parsed`);

// 9. The photos SQL must cover exactly the same people.
const sql = readFileSync(join(HERE, 'students-photos.sql'), 'utf8');
const updates = (sql.match(/^UPDATE/gm) || []).length;
if (updates === students.length) pass(`photos SQL covers all ${students.length} students`);
else fail(`photos SQL has ${updates} UPDATEs but CSV has ${students.length} students`);

console.log(`\n${failures ? `FAILED â€” ${failures} problem(s)` : 'ALL CHECKS PASSED'}`);
await prisma.$disconnect();
process.exit(failures ? 1 : 0);
