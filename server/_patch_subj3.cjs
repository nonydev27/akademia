const fs = require("fs");
const p = "src/controllers/subject.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = String.fromCharCode(125); // '}'
const NEW =
  "  await prisma.subject.update([OPEN] where: [OPEN] id [CLOSE], data: [OPEN] pin: hashPin(pin), pinOwnerId: req.user.id [CLOSE] [CLOSE]);"
    .split("[OPEN]")
    .join("{")
    .split("[CLOSE]")
    .join(C);
lines[92] = NEW; // line 93
lines[166] = NEW; // line 167
fs.writeFileSync(p, lines.join("\n"));
console.log("93 :", lines[92]);
console.log("167:", lines[166]);
