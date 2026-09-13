/**
 * services/aiImport.heuristic.js — deterministic column-mapping parser.
 *
 * Works without any AI provider by looking for well-known header names and, if
 * no header row is found, falling back to positional guessing. Also accepts an
 * optional mapping produced by an LLM (see aiImport.service.js) which takes
 * precedence when present.
 */

const NAME_HEADERS = ['name', 'full name', 'fullname', 'student name', 'student', 'pupil', 'pupil name', 'names', 'student full name', 'full names'];
const ID_HEADERS = ['id', 'student id', 'admission number', 'admission no', 'adm no', 'index', 'index no', 'student no', 'no', 'admission id', 'student number'];
const CLASS_HEADERS = ['class', 'class name', 'level', 'grade', 'form'];
const GENDER_HEADERS = ['gender', 'sex'];
const DOB_HEADERS = ['dob', 'date of birth', 'birth date', 'birthday'];
const SCORE_HINTS = ['ca', 'class score', 'midterm', 'mid term', 'exam', 'examination', 'total', 'score', 'aggregate', 'marks'];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findHeaderRow(rows) {
  // The header is the first row (within the first 10) that contains a name-like word.
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map(norm);
    if (cells.some((c) => NAME_HEADERS.some((h) => c === h || c.includes(h)))) {
      return i;
    }
  }
  return -1;
}

function mapColumns(headerCells) {
  const map = { scores: {} };
  headerCells.forEach((raw, idx) => {
    const c = norm(raw);
    if (!c) return;
    if (map.fullName == null && NAME_HEADERS.some((h) => c === h || c.includes(h))) { map.fullName = idx; return; }
    if (map.admissionNumber == null && ID_HEADERS.some((h) => c === h || c === 'id' || c.endsWith(' id'))) { map.admissionNumber = idx; return; }
    if (map.className == null && CLASS_HEADERS.some((h) => c === h || c.includes(h))) { map.className = idx; return; }
    if (map.gender == null && GENDER_HEADERS.some((h) => c === h || c.includes(h))) { map.gender = idx; return; }
    if (map.dateOfBirth == null && DOB_HEADERS.some((h) => c === h || c.includes(h))) { map.dateOfBirth = idx; return; }
    if (SCORE_HINTS.some((h) => c === h || c.includes(h))) {
      // Group score columns by subject-less generic bucket; keep column index.
      map.scores[c] = idx;
    }
  });
  return map;
}

function parseNumber(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function looksLikeDataRow(row) {
  return row.filter((c) => String(c || '').trim().length > 0).length >= 1;
}

/**
 * @param {string[][]} rows
 * @param {object|null} llmMapping  optional { headerRowIndex, columns, scoreColumns }
 * @returns {{ students: Array, source: 'ai'|'heuristic' }}
 */
export function extractStudentsHeuristic(rows, llmMapping) {
  let headerIdx = findHeaderRow(rows);
  let map;
  let source = 'heuristic';

  if (llmMapping && llmMapping.columns && Number.isInteger(llmMapping.headerRowIndex)) {
    headerIdx = llmMapping.headerRowIndex;
    map = {
      fullName: llmMapping.columns.fullName,
      admissionNumber: llmMapping.columns.admissionNumber,
      className: llmMapping.columns.className,
      gender: llmMapping.columns.gender,
      dateOfBirth: llmMapping.columns.dateOfBirth,
      scores: {},
    };
    const scoreCols = llmMapping.scoreColumns || {};
    for (const [subject, spec] of Object.entries(scoreCols)) {
      if (spec && typeof spec === 'object') map.scores[subject] = spec;
    }
    source = 'ai';
  }

  if (!map && headerIdx !== -1) {
    // Header row detected but no AI mapping — derive columns from the headers.
    map = mapColumns(rows[headerIdx]);
  }

  if (headerIdx === -1 || !map) {
    // No header found — guess positionally: first col = name, rest ignored.
    headerIdx = -1;
    map = { fullName: 0, admissionNumber: null, className: null, gender: null, dateOfBirth: null, scores: {} };
  }

  if (!map || map.fullName == null) {
    // With an AI mapping we may have no name column; fall back to positional.
    map = { fullName: 0, admissionNumber: null, className: null, gender: null, dateOfBirth: null, scores: {}, ...(map || {}) };
  }

  const students = [];
  const seen = new Set();

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!looksLikeDataRow(row)) continue;

    const fullName = String(row[map.fullName] ?? '').trim();
    if (!fullName) continue;
    // Skip repeated header rows that appear mid-document.
    const n = norm(fullName);
    if (NAME_HEADERS.includes(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);

    const student = {
      fullName,
      admissionNumber: map.admissionNumber != null ? String(row[map.admissionNumber] ?? '').trim() || null : null,
      className: map.className != null ? String(row[map.className] ?? '').trim() || null : null,
      gender: map.gender != null ? normalizeGender(row[map.gender]) : null,
      dateOfBirth: map.dateOfBirth != null ? String(row[map.dateOfBirth] ?? '').trim() || null : null,
      grades: {},
    };

    if (llmMapping && llmMapping.scoreColumns) {
      for (const [subject, spec] of Object.entries(llmMapping.scoreColumns)) {
        const g = {};
        if (spec.ca != null) g.caScore = parseNumber(row[spec.ca]);
        if (spec.exam != null) g.examScore = parseNumber(row[spec.exam]);
        if (spec.total != null) g.aggregate = parseNumber(row[spec.total]);
        if (Object.keys(g).some((k) => g[k] != null)) student.grades[subject] = g;
      }
    }

    students.push(student);
  }

  return { students, source };
}

function normalizeGender(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  return String(v).trim();
}
