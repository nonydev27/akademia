/**
 * services/csvRows.js — pure CSV -> string[][] parsing.
 *
 * Deliberately dependency-free: no Prisma, no env, no network. That keeps it
 * importable from offline tooling (e.g. scripts/validate-seed-csv.mjs) without
 * needing database credentials, while aiImport.service.js uses the very same
 * implementation for real uploads. One parser, so tests cannot drift from prod.
 */

/** Split one delimited line, honouring quoted fields and "" escapes. */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === '\t' || ch === ';') { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Turn CSV text into a matrix of trimmed cells. Blank lines are dropped. */
export function rowsFromCsv(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => splitCsvLine(line));
}
