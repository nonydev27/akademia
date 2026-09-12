// Record pinOwnerId when a PIN is set/reset in subject.controller.js
const fs = require("fs");
const p = "src/controllers/subject.controller.js";
let s = fs.readFileSync(p, "utf8");
let n = 0;
const rep = (from, to) => {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    n++;
  } else console.log("NOT FOUND:", from.slice(0, 50));
};

rep(
  "  await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin) });\n  res.json({ message: 'PIN updated successfully' });\n}\n\nexport const verifyPinSchema",
  "  await prisma.subject.update({\n    where: { id },\n    data:  { pin: hashPin(pin), pinOwnerId: req.user.id },\n  });\n  res.json({ message: 'PIN updated successfully' });\n}\n\nexport const verifyPinSchema",
);

// resetMyPin uses the same update line
rep(
  "  await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin) });\n  res.json({ message: 'PIN updated successfully' });\n}\n\n// \u2500\u2500\u2500 Admin: create subject",
  "  await prisma.subject.update({\n    where: { id },\n    data:  { pin: hashPin(pin), pinOwnerId: req.user.id },\n  });\n  res.json({ message: 'PIN updated successfully' });\n}\n\n// \u2500\u2500\u2500 Admin: create subject",
);

fs.writeFileSync(p, s);
console.log("applied", n, "replacement(s)");
