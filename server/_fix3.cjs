// Line 191 in student.controller.js must close the findUnique include object:
//   include: { enrollments: { include: { class: true } },
//   } })          <-- this line
const fs = require("fs");
const p = "src/controllers/student.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const O = "{";
const C = "}";
// Build "  [CLOSE] [CLOSE]);"
const wanted = "  [CLOSE] [CLOSE]);".split("[CLOSE]").join(C);
lines[190] = wanted; // 0-based index 190 == line 191
fs.writeFileSync(p, lines.join("\n"));
console.log("line 191 now:", lines[190]);
