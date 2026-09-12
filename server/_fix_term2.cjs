const fs = require("fs");
const p = "src/controllers/term.controller.js";
const lines = fs.readFileSync(p, "utf8").split("\n");
// The findMany(...) call must close with "  });"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "});" && i > 5) {
    lines[i] = "  });";
    break;
  }
}
fs.writeFileSync(p, lines.join("\n"));
console.log(lines.slice(10, 16).join("\n"));
