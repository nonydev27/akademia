// Fix the three lines in listMyAssignments that lost a closing brace.
const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = String.fromCharCode(125); // '}'
lines[229] =
  "      class:   { select: { id: true, name: true, code: true } " + C + ",";
lines[230] =
  "      subject: { select: { id: true, name: true, code: true } " + C + ",";
lines[232] =
  "    orderBy: [{ class: { name: 'asc' } " +
  C +
  " }, { subject: { name: 'asc' } " +
  C +
  "],";
fs.writeFileSync(p, lines.join("\n"));
console.log("230:", lines[229]);
console.log("231:", lines[230]);
console.log("233:", lines[232]);
