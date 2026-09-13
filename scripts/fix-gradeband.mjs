import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const existing = await prisma.gradeBand.findMany();
  if (existing.length < 6) {
    const student = await prisma.student.findFirst();
    if (student) {
      await prisma.gradeBand.create({
        data: { tenantId: student.tenantId, letter: 'F', minScore: 0, maxScore: 39, remark: 'Failing' },
      });
      console.log('Added F grade band');
    }
  }
  const all = await prisma.gradeBand.findMany({ orderBy: { minScore: 'asc' } });
  console.log('Grade bands:', JSON.stringify(all, null, 2));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
