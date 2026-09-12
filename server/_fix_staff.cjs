/**
 * Fix staff.controller.js selects that lost their extra closing brace.
 * Every `class: { select: { ... } },` and `subject: { select: { ... } },`
 * inside an `include:` must end with `} },` (not `},`).
 */
const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
let fixed = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Lines like:  "      class:   { select: { id: true, name: true, code: true },"
  if (
    /^\s*(class|subject):\s+\{ select: \{.*\}\s*,\s*$/.test(l) &&
    !l.trim().endsWith("} },")
  ) {
    lines[i] = l.replace(/\}\s*,\s*$/, "} },");
    fixed++;
  }
}
// listTeachers uses 10-space indentation ("          class: ..."), the regex covers it.
fs.writeFileSync(p, lines.join("\n"));
console.log("fixed", fixed, "line(s)");
