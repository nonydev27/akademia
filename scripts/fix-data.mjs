import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  // Set term as ACTIVE
  await prisma.term.updateMany({
    data: { status: 'ACTIVE' },
    where: { id: 'c79af36c-b7f5-47c9-8ea4-5379f731a1ff' },
  });
  console.log('Set term ACTIVE');

  // Check grade bands
  const existing = await prisma.gradeBand.findMany();
  console.log('Existing grade bands:', existing.length);

  // Add grade bands if empty
  if (existing.length === 0) {
    const student = await prisma.student.findFirst();
    if (student) {
      const gradeBands = [
        { letter: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
        { letter: 'B', minScore: 70, maxScore: 79, remark: 'Very Good' },
        { letter: 'C', minScore: 60, maxScore: 69, remark: 'Good' },
        { letter: 'D', minScore: 50, maxScore: 59, remark: 'Pass' },
        { letter: 'E', minScore: 40, maxScore: 49, remark: 'Poor' },
        { letter: 'F', minScore: 0, maxScore: 39, remark: 'Failing' },
      ];
      for (const gb of gradeBands) {
        await prisma.gradeBand.create({
          data: { tenantId: student.tenantId, ...gb },
        });
      }
      console.log('Created 6 grade bands');
    }
  }

  // Check Super Admin
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  console.log('Super Admin exists:', !!superAdmin);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
