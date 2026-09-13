import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const allUsers = await prisma.user.findMany({ select: { email: true, role: true, fullName: true, tenantId: true } });
  console.log('All Users:', JSON.stringify(allUsers, null, 2));

  const gb = await prisma.gradeBand.findMany();
  console.log('GradeBands count:', gb.length);

  const classes = await prisma.class.findMany({ select: { id: true, name: true, code: true, tenantId: true } });
  console.log('Classes:', JSON.stringify(classes, null, 2));

  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, code: true } });
  console.log('Subjects:', JSON.stringify(subjects, null, 2));

  const students = await prisma.student.findMany({ select: { id: true, admissionNumber: true, fullName: true } });
  console.log('Students:', JSON.stringify(students, null, 2));

  const activeTerm = await prisma.term.findFirst({ where: { status: 'ACTIVE' } });
  console.log('Active Term:', JSON.stringify(activeTerm));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
