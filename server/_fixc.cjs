// The class list include block is missing its closing braces.
const fs = require("fs");
const p = "src/controllers/class.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
const C = "}";
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (
    l.includes("include: { _count: { select: { enrollments: true } },") &&
    !l.includes("} })")
  ) {
    lines[i] = l.replace("{ enrollments: true },", "{ enrollments: true } },");
    // next line should close the findMany arg
    if (lines[i + 1] && lines[i + 1].trim() === "});") {
      lines[i + 1] = "  });";
    } else if (lines[i + 1] && lines[i + 1].trim() === "} });") {
      // already fine
    } else {
      lines.splice(i + 1, 0, "  });");
    }
    break;
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log("patched class.controller.js");
