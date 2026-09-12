const fs = require("fs");
const p = "src/controllers/subject.controller.js";
let s = fs.readFileSync(p, "utf8");

const fixes = [
  [
    "where: { teacherId: req.user.id, subject: { tenantId: req.tenantId },",
    "where: { teacherId: req.user.id, subject: { tenantId: req.tenantId },",
  ],
];
// Use targeted string replacements on the exact broken fragments:
s = s
  .split("subject: { tenantId: req.tenantId },\n    include:")
  .join("subject: { tenantId: req.tenantId } }\n    include: {");
s = s
  .split(
    "subject: { select: { id: true, name: true, code: true, pin: true },\n      class:",
  )
  .join(
    "subject: { select: { id: true, name: true, code: true, pin: true },\n      class:",
  );
s = s
  .split("class:   { select: { id: true, name: true },\n    },")
  .join("class:   { select: { id: true, name: true },\n    },");
s = s
  .split("orderBy: { subject: { name: 'asc' },\n  });")
  .join("orderBy: { subject: { name: 'asc' },\n  });");
s = s
  .split(
    "await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId });\n  if (!subject) throw ApiError.notFound('Subject not found');\n\n  if (req.user.role !== 'SCHOOL_ADMIN') {",
  )
  .join(
    "await prisma.subject.findFirst({ where: { id, tenantId: req.tenantId });\n  if (!subject) throw ApiError.notFound('Subject not found');\n\n  if (req.user.role !== 'SCHOOL_ADMIN') {",
  );
s = s
  .split(
    "await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin) });\n  res.json({ message: 'PIN updated successfully' });\n}\n\n// \u2500\u2500\u2500 Admin: create subject",
  )
  .join(
    "await prisma.subject.update({ where: { id }, data: { pin: hashPin(pin) });\n  res.json({ message: 'PIN updated successfully' });\n}\n\n// \u2500\u2500\u2500 Admin: create subject",
  );

fs.writeFileSync(p, s);
console.log("patched");
