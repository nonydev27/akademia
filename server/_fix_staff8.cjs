const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = String.fromCharCode(125); // '}'
// Target: orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],
const el1 = "{ class: { name: 'asc' } " + C;
const el2 = "{ subject: { name: 'asc' } " + C;
const line233 = "    orderBy: [" + el1 + ", " + el2 + "],";
lines[232] = line233;
fs.writeFileSync(p, lines.join("\n"));
console.log("233:", lines[232]);
