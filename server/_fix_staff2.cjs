// Remove the duplicated/garbled accessCode lines (160-163) in staff.controller.js.
const fs = require("fs");
const p = "src/controllers/staff.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
// Remove indices 159..162 (lines 160..163), which are the scrambled duplicates.
lines.splice(159, 4);
fs.writeFileSync(p, lines.join("\n"));
console.log("removed 4 lines; context now:");
for (let i = 153; i < 162; i++) console.log(i + 1 + ": " + lines[i]);
