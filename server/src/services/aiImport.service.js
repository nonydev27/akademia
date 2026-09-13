/**
 * services/aiImport.service.js — extract student records (and optional grades)
 * from an uploaded document so admins/teachers don't have to retype them.
 *
 * Pipeline:
 *   1. Decode the upload and pull out raw rows/text based on file type:
 *        - CSV / TXT  → parsed directly
 *        - XLSX/XLS   → first sheet turned into a matrix of rows
 *        - PDF        → text extracted, then rows inferred from lines
 *   2. Structure the raw data into student objects. If an LLM is configured
 *      (OPENAI_API_KEY) we ask it to map arbitrary column names; otherwise a
 *      robust heuristic mapper handles the common Ghanaian school layouts.
 *
 * The result is always a *preview* — nothing is written to the database here.
 * The client shows the preview and the user confirms the import.
 */

import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { env } from '../config/env.js';
import { extractStudentsHeuristic } from './aiImport.heuristic.js';
import { rowsFromCsv } from './csvRows.js';

export { rowsFromCsv };

const MAX_ROWS = 500;

function decodeBase64(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || '');
  if (match) return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
  // Allow a bare base64 string too.
  return { mime: 'application/octet-stream', buffer: Buffer.from(dataUrl || '', 'base64') };
}

function rowsFromXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  return matrix.map((r) => r.map((c) => (c == null ? '' : String(c).trim())));
}


async function rowsFromPdf(buffer) {
  const { text } = await pdfParse(buffer);
  // Try to read the PDF as a table: split lines, then columns by 2+ spaces or tabs.
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const cells = line.split(/\s{2,}|\t+/).map((c) => c.trim());
    if (cells.length >= 2) rows.push(cells);
  }
  return rows;
}

async function extractRows({ mime, buffer, fileName }) {
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.csv') || mime.includes('csv')) {
    return rowsFromCsv(buffer.toString('utf8'));
  }
  if (name.endsWith('.pdf') || mime.includes('pdf')) {
    return rowsFromPdf(buffer);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || mime.includes('spreadsheet') || mime.includes('excel')) {
    return rowsFromXlsx(buffer);
  }
  // .txt or unknown: treat as delimited text.
  return rowsFromCsv(buffer.toString('utf8'));
}

// ── Optional LLM structuring ────────────────────────────────

const LLM_TIMEOUT_MS = 15_000;

async function structureWithLLM(rows) {
  const key = env.OPENAI_API_KEY;
  // No provider configured -> skip straight to the heuristic parser. This is a
  // normal path, not an error: the importer is designed to work without AI.
  if (!key) return null;

  const sample = rows.slice(0, 60);
  const prompt =
    'You are given a table extracted from a school document, as a JSON array of rows. ' +
    'Identify which column is the student full name, and any columns that are Student ID, ' +
    'class, gender, date of birth, and subject scores (e.g. CA, Exam, Total). ' +
    'Return ONLY JSON: {"headerRowIndex":number,"columns":{"fullName":n,"admissionNumber":n,' +
    '"className":n,"gender":n,"dateOfBirth":n},"scoreColumns":{"<subject name>":{"ca":n,"exam":n,"total":n}}}. ' +
    'Omit keys you cannot find. Rows:\n' + JSON.stringify(sample);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
      // Hard cap: without this a slow or unreachable provider leaves the import
      // request hanging, and the user just sees a spinner with no feedback.
      // Timing out falls through to the heuristic parser below, which is the
      // whole point of having one.
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const content = body.choices?.[0]?.message?.content;
    return content ? JSON.parse(content) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Parse an uploaded document into a preview of students (+ optional grades).
 * @returns {Promise<{ students: Array, source: 'ai'|'heuristic', rowCount: number }>}
 */
export async function parseStudentDocument({ fileData, fileName, tenantId }) {
  const { mime, buffer } = decodeBase64(fileData);
  const rows = await extractRows({ mime, buffer, fileName });
  if (!rows.length) {
    return { students: [], source: 'heuristic', rowCount: 0, warning: 'No readable rows found in the document.' };
  }

  const limited = rows.slice(0, MAX_ROWS);
  const llmMapping = await structureWithLLM(limited);
  const { students, source } = extractStudentsHeuristic(limited, llmMapping);

  return {
    students,
    source: llmMapping ? 'ai' : source,
    rowCount: limited.length,
    truncated: rows.length > MAX_ROWS,
  };
}
