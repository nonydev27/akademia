const fs = require("fs");
const p =
  "c:/Users/user/Desktop/akademia/server/src/controllers/tenant.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const OPEN = "{";
const CLOSE = String.fromCharCode(0x7d); // }
const target =
  "  const existing = await prisma.subscription.findUnique(" +
  OPEN +
  " where: " +
  OPEN +
  " tenantId: req.params.id " +
  CLOSE +
  CLOSE +
  ");";
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes("findUnique(") &&
    lines[i].includes("tenantId: req.params.id") &&
    lines[i].includes("//") === false
  ) {
    if (lines[i] !== target) {
      lines[i] = target;
      fixed++;
    }
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log("lines fixed:", fixed);
console.log("line 115:", JSON.stringify(lines[114]));
