import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const tokens = await prisma.passwordResetToken.findMany({ take: 5 });
  console.log('PasswordResetToken table:', tokens.length > 0 ? 'EXISTS' : 'EMPTY (expected - no resets yet)');

  const users = await prisma.user.findMany({ take: 5, select: { email: true, role: true } });
  console.log('Users:', JSON.stringify(users, null, 2));

  const terms = await prisma.term.findMany({ take: 5, select: { id: true, label: true, status: true } });
  console.log('Terms:', JSON.stringify(terms, null, 2));

  const academicYears = await prisma.academicYear.findMany({ select: { id: true, label: true } });
  console.log('AcademicYears:', JSON.stringify(academicYears, null, 2));

  const gradeBands = await prisma.gradeBand.findMany({ take: 3 });
  console.log('GradeBands:', JSON.stringify(gradeBands, null, 2));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
