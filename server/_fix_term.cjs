const fs = require("fs");
const p = "src/controllers/term.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = String.fromCharCode(125);
const NEW =
  "    include: [OPEN] academicYear: [OPEN] select: [OPEN] id: true, label: true [CLOSE] [CLOSE],"
    .split("[OPEN]")
    .join("{")
    .split("[CLOSE]")
    .join(C);
for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes(
      "include: { academicYear: { select: { id: true, label: true },",
    )
  ) {
    lines[i] = NEW;
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log("term.controller patched");
