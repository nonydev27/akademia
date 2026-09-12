// Fix missing braces introduced in student.controller.js update():
//  1) findFirst class lookup
//  2) fresh findUnique include block
const fs = require("fs");
const p = "src/controllers/student.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = "}";
let changed = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // 1) class findFirst
  if (
    l.includes("await prisma.class.findFirst") &&
    l.trim().endsWith("});") &&
    !l.trim().endsWith("} });")
  ) {
    lines[i] = l.slice(0, -3) + ") " + C + " });";
    changed++;
  }
  // 2) findUnique include: line ending with "{ class: true },"
  if (
    l.includes("include: { enrollments: { include: { class: true },") &&
    !l.includes("} })")
  ) {
    lines[i] = l.replace("{ class: true },", "{ class: true } },");
    changed++;
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log("changed", changed);
