const fs = require("fs");
const p = "prisma/seed.js";
let s = fs.readFileSync(p, "utf8");
let n = 0;
const rep = (from, to) => {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    n++;
  } else console.log("MISS:", from.slice(0, 50));
};

rep(
  "name: 'Demo School', schoolLevel: 'JHS'",
  "name: 'Demo School', code: 'DMS', schoolLevel: 'JHS'",
);
rep("name: 'JHS 2' } ", "name: 'JHS 2', code: 'JHS2-A' } ");
rep("name: 'JHS 2' })", "name: 'JHS 2', code: 'JHS2-A' })");

fs.writeFileSync(p, s);
console.log("applied", n);
