const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = String.fromCharCode(125); // '}'
// orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],
const line233 =
  "    orderBy: [{ class: { name: 'asc' } " +
  C +
  " }, { subject: { name: 'asc' }]";
lines[232] = line233;
fs.writeFileSync(p, lines.join("\n"));
console.log("233:", lines[232]);
