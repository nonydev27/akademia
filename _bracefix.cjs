const fs = require("fs");
const path = require("path");

const ROOT = "c:/Users/user/Desktop/akademia/server/src";
const CLOSE = String.fromCharCode(0x7d); // }

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith(".js")) out.push(full);
  }
  return out;
}

let totalFixed = 0;
const report = [];

for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Repair the specific malformation: `where: { X: Y });`  (one brace short)
    // Detect: contains "where: {" and the line has more '{' than '}'.
    if (l.includes("where: {") && l.includes(");")) {
      const opens = (l.match(/\{/g) || []).length;
      const closes = (l.match(/\}/g) || []).length;
      if (opens > closes) {
        const need = opens - closes;
        // Insert the missing close-brace(s) just before the final `)`.
        const idx = l.lastIndexOf(")");
        const fixed = l.slice(0, idx) + CLOSE.repeat(need) + l.slice(idx);
        lines[i] = fixed;
        changed = true;
        totalFixed++;
        report.push(`${path.basename(file)}:${i + 1}`);
      }
    }
  }
  if (changed) fs.writeFileSync(file, lines.join("\n"));
}

console.log("files scanned:", walk(ROOT).length);
console.log("lines fixed:", totalFixed);
console.log(report.join("\n"));
