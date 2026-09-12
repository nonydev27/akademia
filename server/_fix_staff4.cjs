const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = "}";
// line 233 (index 232): orderBy array needs a closing '}' on the subject object
if (
  lines[232] &&
  lines[232].includes(
    "orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],",
  )
) {
  lines[232] =
    "    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],";
}
// Also fix the include selects (lines 229/230 area) to close properly
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (
    l.includes("class:   { select: { id: true, name: true, code: true }") &&
    l.trim().endsWith("},") &&
    !l.trim().endsWith("} },")
  ) {
    lines[i] = l.replace(/\}\s*,\s*$/, "} },");
  }
  if (
    l.includes("subject: { select: { id: true, name: true, code: true }") &&
    l.trim().endsWith("},") &&
    !l.trim().endsWith("} },")
  ) {
    lines[i] = l.replace(/\}\s*,\s*$/, "} },");
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log("orderBy line now:", lines[232]);
