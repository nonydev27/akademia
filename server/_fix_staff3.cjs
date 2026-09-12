// Add code:true to the assign() include selects (lines 166 & 167).
const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
// 1-based 166 -> index 165, 167 -> index 166
lines[165] = "      class:   { select: { id: true, name: true, code: true } },";
lines[166] = "      subject: { select: { id: true, name: true, code: true } },";
fs.writeFileSync(p, lines.join("\n"));
console.log("166:", lines[165]);
console.log("167:", lines[166]);
