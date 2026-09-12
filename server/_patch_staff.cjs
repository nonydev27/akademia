/**
 * Patch staff.controller.js:
 *  - add `code` to assignment class/subject selects
 *  - generate the teacher-facing accessCode on assign
 *  - restrict listAssignments to the caller when the caller is STAFF
 */
const fs = require("fs");
const p = "src/controllers/staff.controller.js";
let s = fs.readFileSync(p, "utf8");
const O = "{";
const C = "}";
let n = 0;
const rep = (from, to) => {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    n++;
  } else {
    console.log("NOT FOUND:", JSON.stringify(from.slice(0, 60)));
  }
};

// 1) assignment include selects: add code
rep(
  "      class:   { select: { id: true, name: true },", // in assign()
  "      class:   { select: { id: true, name: true, code: true },",
);
rep(
  "      subject: { select: { id: true, name: true },\n      teacher: { select: { id: true, fullName: true },",
  "      subject: { select: { id: true, name: true, code: true },\n      teacher: { select: { id: true, fullName: true } },",
);
// Fallback for the assignment include block (if the above didn't match)
rep(
  "      class:   { select: { id: true, name: true, code: true },\n      subject: { select: { id: true, name: true },",
  "      class:   { select: { id: true, name: true, code: true },\n      subject: { select: { id: true, name: true, code: true } },",
);

// 2) create accessCode before the upsert
rep(
  "  const assignment = await prisma.teacherClassSubject.upsert({\n    where:  { teacherId_classId_subjectId: { teacherId, classId, subjectId },\n    create: { teacherId, classId, subjectId },",
  "  // Teacher-facing surrogate key, e.g. T-AO-ENGLP2-JHS2A (never a UUID).\n" +
    "  const teacherInitials = (teacher.fullName.match(/\\b[A-Za-z]/g) || ['T'])\n" +
    "    .slice(0, 2).join('').toUpperCase();\n" +
    "  const accessCode = `T-${teacherInitials}-${subject.code}-${klass.code}`;\n\n" +
    "  const assignment = await prisma.teacherClassSubject.upsert({\n    where:  { teacherId_classId_subjectId: { teacherId, classId, subjectId },\n    create: { teacherId, classId, subjectId, accessCode },",
);

// 3) listAssignments: restrict staff to own assignments
rep(
  "export async function listAssignments(req, res) {\n  const { classId, teacherId } = req.query;\n\n  const assignments = await prisma.teacherClassSubject.findMany({\n    where: {\n      teacher: { tenantId: req.tenantId },\n      ...(classId   ? { classId }   : {}),\n      ...(teacherId ? { teacherId } : {}),\n    },",
  "export async function listAssignments(req, res) {\n  const { classId, teacherId } = req.query;\n\n  // A teacher may only ever see their own assignments.\n  const effectiveTeacherId = req.user.role === 'STAFF' ? req.user.id : teacherId;\n\n  const assignments = await prisma.teacherClassSubject.findMany({\n    where: {\n      teacher: { tenantId: req.tenantId },\n      ...(classId            ? { classId }            : {}),\n      ...(effectiveTeacherId ? { teacherId: effectiveTeacherId } : {}),\n    },",
);

// 4) listAssignments include: add class/subject codes
rep(
  "      class:   { select: { id: true, name: true },\n      subject: { select: { id: true, name: true },\n    },\n    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],",
  "      class:   { select: { id: true, name: true, code: true },\n      subject: { select: { id: true, name: true, code: true },\n    },\n    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' }],",
);

fs.writeFileSync(p, s);
console.log("applied", n, "replacement(s)");
