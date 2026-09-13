/**
 * scripts/generate-seed-students.mjs
 *
 * Generates two artifacts for demo/seed data:
 *
 *   1. seed-students-import.csv  — columns the AI importer understands, so it can
 *      be pasted/uploaded straight into "Import with AI". Student IDs are left
 *      blank on purpose: import.controller.js then calls nextStudentId() for
 *      each row, so the tenant's studentSeq stays the single source of truth
 *      and IDs come out as SON-001, SON-002, …
 *
 *      NOTE: photos are NOT in this file. The importer only reads
 *      fullName / admissionNumber / gender / dateOfBirth / class. Anything else
 *      is dropped, and commitSchema has no profilePicUrl field.
 *
 *   2. students-photos.sql — UPDATE statements that attach the photo URLs to
 *      the students that were just created, matched on fullName.
 *
 * Deterministic: a fixed PRNG seed means re-running produces the same roster.
 *
 * Run:  node scripts/generate-seed-students.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ config */

// Class names COPIED VERBATIM from the database (scripts/print-classes.mjs),
// character for character.
//
// Do not "tidy" these. The importer matches on the exact string.
//
// WARNING: the database stores 'SCIENCE 1-A ' with a TRAILING SPACE that is not
// in the list below (charCodes …45,65,32 — the final 32 is a plain space). So the
// list cannot be byte-identical to the DB no matter what is written here.
//
// That is deliberate and safe: classKey() collapses whitespace and trims both
// ends, so matching 'SCIENCE 1-A' against 'SCIENCE 1-A ' succeeds. The validator
// confirms this, and only this class, reports a normalisation-only match.
// Rebuilding the DB class name without the trailing space is the clean fix.
//
// Names listed here are ALLOWED to carry leading/trailing whitespace (see below).
// Keep the literal exactly as written, trailing space included.
const DB_NAMES_WITH_TRAILING_SPACE = new Set(['SCIENCE 1-A ']);

const CLASSES = [
  { name: 'BUSINESS-1',   code: 'BUS-001', count: 42, ageRange: [15, 17] },
  { name: 'BUSINESS-2',   code: 'BUS-002', count: 40, ageRange: [16, 18] },
  { name: 'SCIENCE 1-A ', code: 'SCI-01A', count: 42, ageRange: [15, 17] }, // trailing space: matches the DB
  { name: 'SCIENCE 1-B',  code: 'SCI-01B', count: 41, ageRange: [15, 17] },
  { name: 'SCIENCE 2-A',  code: 'SCI-02A', count: 41, ageRange: [16, 18] },
  { name: 'SCIENCE 2-B',  code: 'SCI-02B', count: 40, ageRange: [16, 18] },
];

const SCHOOL_YEAR_START = new Date('2026-09-01'); // "today" for age maths

/* --------------------------------------------------------- name components */

const MALE_NAMES = [
  'Kwame', 'Kofi', 'Yaw', 'Kwabena', 'Kwaku', 'Yaa', 'Kwadwo', 'Nana',
  'Emmanuel', 'Samuel', 'Daniel', 'Michael', 'Joshua', 'Prince', 'Isaac',
  'Kelvin', 'Elijah', 'Stephen', 'Richmond', 'Bernard', 'Godfred', 'Francis',
  'Ebenezer', 'Nii', 'Bright', 'Collins', 'Desmond', 'Frank', 'Gideon',
  'Harrison', 'Ibrahim', 'Jeffrey', 'Kingsley', 'Lawrence', 'Maxwell',
  'Nathaniel', 'Obed', 'Patrick', 'Raymond', 'Seth', 'Theophilus', 'Vincent',
  'Wisdom', 'Abdul', 'Ato', 'Baffour', 'Cyrus', 'Derrick', 'Eric', 'Felix',
  'Gabriel', 'Henry', 'Ishmael', 'Jeremiah', 'Kojo', 'Louis', 'Mensah',
  'Nicholas', 'Osei', 'Percy', 'Quincy', 'Raphael', 'Silas', 'Tobias',
];

const FEMALE_NAMES = [
  'Akosua', 'Abena', 'Adwoa', 'Afua', 'Ama', 'Yaa', 'Esi', 'Akua',
  'Grace', 'Mary', 'Elizabeth', 'Sarah', 'Abigail', 'Comfort', 'Priscilla',
  'Naomi', 'Esther', 'Rebecca', 'Gifty', 'Hannah', 'Ivy', 'Josephine',
  'Keziah', 'Linda', 'Mabel', 'Naa', 'Ophelia', 'Patience', 'Queendalyn',
  'Rosemond', 'Selina', 'Theresa', 'Ursula', 'Vida', 'Wilhemina', 'Yvonne',
  'Zainab', 'Blessing', 'Cynthia', 'Doris', 'Emelia', 'Felicia', 'Gloria',
  'Harriet', 'Irene', 'Joyce', 'Kendra', 'Lydia', 'Matilda', 'Nadia',
  'Ohemaa', 'Philomena', 'Rhoda', 'Stella', 'Tracy', 'Vivian', 'Winifred',
  'Yasmin', 'Zoe', 'Adjoa', 'Efua', 'Nhyira', 'Serwaa', 'Maame',
];

const SURNAMES = [
  'Mensah', 'Boateng', 'Owusu', 'Asante', 'Agyemang', 'Osei', 'Addo',
  'Amoah', 'Appiah', 'Ansah', 'Baidoo', 'Bonsu', 'Danso', 'Darko',
  'Dartey', 'Donkor', 'Frimpong', 'Gyamfi', 'Gyasi', 'Kyei', 'Larbi',
  'Nkrumah', 'Nyarko', 'Opoku', 'Ofori', 'Quarshie', 'Sarpong', 'Tetteh',
  'Yeboah', 'Adjei', 'Acheampong', 'Adutwum', 'Akoto', 'Anim', 'Antwi',
  'Appau', 'Arthur', 'Bediako', 'Boakye', 'Essien', 'Aidoo', 'Ampofo',
  'Asamoah', 'Awuah', 'Baffoe', 'Bempah', 'Blay', 'Dapaah', 'Eshun',
  'Kusi', 'Mireku', 'Nti', 'Peprah', 'Safo', 'Twum', 'Wiredu', 'Yorke',
  'Zakari', 'Amissah', 'Aggrey', 'Bediatuo', 'Nkansah', 'Otu',
];

const MIDDLE_MALE = ['Kojo', 'Kwesi', 'Kwame', 'Yaw', 'Nii', 'Kofi', 'Paapa'];
const MIDDLE_FEMALE = ['Akua', 'Adjoa', 'Afia', 'Esi', 'Naa', 'Aba', 'Yaa'];

const NATIONALITIES = ['Ghanaian', 'Ghanaian', 'Ghanaian', 'Ghanaian', 'Nigerian', 'Togolese', 'Ivorian'];
const RELIGIONS = ['Christianity', 'Christianity', 'Christianity', 'Islam', 'Islam', 'Traditional'];
const TOWNS = [
  'East Legon', 'Madina', 'Adenta', 'Spintex', 'Tema', 'Achimota', 'Dzorwulu',
  'Lapaz', 'Dansoman', 'Kaneshie', 'Osu', 'Airport Residential', 'Haatso',
  'Ashaley Botwe', 'Ashaiman', 'Nungua', 'Teshie', 'Mamprobi', 'Awoshie',
];
const PREVIOUS_SCHOOLS = [
  'Sunrise Basic School', 'Bright Future Academy', 'St. Peter\u2019s Basic School',
  'Ridge International School', 'Galaxy Preparatory', 'Hope Academy',
  'Divine Grace School', 'New Era Academy', 'Little Angels School', 'Crown Prep',
];

/* ------------------------------------------------------------ deterministic */

// mulberry32 — small, fast, and stable across Node versions (unlike Math.random).
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20260901);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickInt = (min, max) => min + Math.floor(rng() * (max - min + 1));

/* ------------------------------------------------------------------- output */

function buildRoster() {
  const rows = [];
  const usedNames = new Set();

  for (const klass of CLASSES) {
    let made = 0;
    let guard = 0;

    while (made < klass.count && guard < klass.count * 200) {
      guard += 1;

      // ~50/50 split, alternating to keep every class balanced.
      const female = made % 2 === 1;

      const first = female ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
      const middle = female ? pick(MIDDLE_FEMALE) : pick(MIDDLE_MALE);
      const surname = pick(SURNAMES);

      // Duplicate people in a class look like a data error, so enforce unique
      // full names. The importer also de-dupes by name.
      const fullName = `${first} ${middle} ${surname}`;
      if (usedNames.has(fullName)) continue;
      usedNames.add(fullName);

      const [minAge, maxAge] = klass.ageRange;
      const age = pickInt(minAge, maxAge);
      // Date of birth: school-year-start minus age, offset a few months.
      const dob = new Date(SCHOOL_YEAR_START);
      dob.setFullYear(dob.getFullYear() - age);
      dob.setDate(dob.getDate() - pickInt(0, 300));

      rows.push({
        fullName,
        gender: female ? 'Female' : 'Male',
        dateOfBirth: dob.toISOString().slice(0, 10),
        className: klass.name,
        nationality: pick(NATIONALITIES),
        religion: pick(RELIGIONS),
        address: `${pickInt(1, 120)} ${pick(TOWNS)}, ${pick(['Accra', 'Tema', 'Accra', 'Accra'])}`,
        previousSchool: pick(PREVIOUS_SCHOOLS),
        // Free, no-key, CORS-enabled portrait endpoint -> real photos in the UI.
        photoUrl: `https://i.pravatar.cc/300?gender=${female ? 'female' : 'male'}&u=${encodeURIComponent(fullName)}`,
      });

      made += 1;
    }
  }

  return rows;
}

/** Split a name into URL-safe tokens for the fallback DiceBear images. */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows) {
  const header = [
    'Name',
    'Student ID',      // left blank -> server auto-generates SON-001…
    'Class',
    'Gender',
    'Date of Birth',
    'Nationality',
    'Religion',
    'Guardian Address',
    'Previous School',
  ];
  const lines = [header.map(csvEscape).join(',')];

  for (const r of rows) {
    lines.push([
      r.fullName,
      '',                 // intentional: let studentSeq allocate
      r.className,
      r.gender,
      r.dateOfBirth,
      r.nationality,
      r.religion,
      r.address,
      r.previousSchool,
    ].map(csvEscape).join(','));
  }

  return lines.join('\r\n') + '\r\n';
}

function toPhotoSql(rows) {
  const lines = [
    '-- scripts/students-photos.sql',
    '-- Attach profile photos to the students created from the import CSV.',
    '-- Matches on fullName, which is unique within the generated roster.',
    '-- For the current tenant; adjust the TENANT filter if you have more than one school.',
    '',
    'BEGIN;',
    '',
  ];

  for (const r of rows) {
    const name = r.fullName.replace(/'/g, "''");
    const fallback = `https://api.dicebear.com/9.x/avataaars/svg?seed=${slugify(r.fullName)}`;
    lines.push(
      `UPDATE "Student" SET "profilePicUrl" = '${r.photoUrl}' ` +
      `WHERE "fullName" = '${name}' AND "profilePicUrl" IS NULL;`,
    );
    // Keep the fallback visible in the file so it is easy to swap providers.
    lines.push(`--   fallback: ${fallback}`);
  }

  lines.push('', 'COMMIT;', '');
  return lines.join('\n');
}

/* ---------------------------------------------------------------------- run */

const roster = buildRoster();

// A trailing space in a class name is invisible in a diff and in the CSV, so an
// accidental one would ship silently. Fail loudly instead — but allow the names
// that were checked against the DB and deliberately kept verbatim.
for (const k of CLASSES) {
  if (k.name !== k.name.trim() && !DB_NAMES_WITH_TRAILING_SPACE.has(k.name)) {
    throw new Error(
      `Class name ${JSON.stringify(k.name)} has unexpected leading/trailing whitespace. ` +
      `It is not in DB_NAMES_WITH_TRAILING_SPACE, so it is probably a typo. ` +
      `If the DB really stores it that way, check with scripts/print-classes.mjs first.`,
    );
  }
}

const csvPath = join(HERE, 'seed-students-import.csv');
const sqlPath = join(HERE, 'students-photos.sql');

// CRLF + BOM-free UTF-8: Excel and the server's csv parser both accept it.
writeFileSync(csvPath, toCsv(roster), 'utf8');
writeFileSync(sqlPath, toPhotoSql(roster), 'utf8');

const byClass = {};
const byGender = { Male: 0, Female: 0 };
for (const r of roster) {
  byClass[r.className] = (byClass[r.className] || 0) + 1;
  byGender[r.gender] += 1;
}

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${sqlPath}`);
console.log(`\nTotal students: ${roster.length}`);
console.log(`  Male: ${byGender.Male}   Female: ${byGender.Female}`);
console.log('\nPer class:');
for (const c of CLASSES) {
  console.log(`  ${c.name.padEnd(12)} ${String(byClass[c.name]).padStart(3)}`);
}
