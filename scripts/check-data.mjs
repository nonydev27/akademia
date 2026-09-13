import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  // Check and fix grade bands
  const existing = await prisma.gradeBand.findMany();
  console.log('GradeBands:', existing.length);
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
        await prisma.gradeBand.create({ data: { tenantId: student.tenantId, ...gb } });
      }
      console.log('Created 6 grade bands');
    }
  }

  // Check Super Admin
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  console.log('Super Admin:', superAdmin ? superAdmin.email : 'MISSING');

  // Check term
  const term = await prisma.term.findFirst();
  console.log('Term:', term?.label, term?.status);

  // Check tenant
  const tenant = await prisma.tenant.findFirst();
  console.log('Tenant:', tenant?.name, tenant?.code);

  // Check if admin user exists for tenant
  const admin = await prisma.user.findFirst({ where: { role: 'SCHOOL_ADMIN' } });
  console.log('School Admin:', admin ? admin.email : 'MISSING');

  // Students count
  const students = await prisma.student.count();
  console.log('Students:', students);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
