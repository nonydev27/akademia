/**
 * prisma/seed.js — bootstraps a Super Admin and a demo tenant so there's
 * something to log into right after the first migration.
 *
 * Run with: npx prisma db seed
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@akademia.app';
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe123!';

async function main() {
  const superAdminHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: { email: SUPER_ADMIN_EMAIL, fullName: 'Platform Super Admin', role: 'SUPER_ADMIN', passwordHash: superAdminHash },
    update: {},
  });
  console.log(`Super Admin ready: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);

  const existingTenant = await prisma.tenant.findFirst({ where: { name: 'Demo School' } });
  if (existingTenant) {
    console.log('Demo School already seeded, skipping.');
    return;
  }

  const tenant = await prisma.tenant.create({ data: { name: 'Demo School', schoolLevel: 'JHS' } });

  await prisma.subscription.create({
    data: { tenantId: tenant.id, status: 'ACTIVE', expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  });

  const adminHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.create({
    data: { tenantId: tenant.id, role: 'SCHOOL_ADMIN', fullName: 'Demo Admin', email: 'admin@demoschool.app', passwordHash: adminHash },
  });

  const staffHash = await bcrypt.hash('Staff123!', 10);
  await prisma.user.create({
    data: { tenantId: tenant.id, role: 'STAFF', fullName: 'Demo Teacher', email: 'teacher@demoschool.app', passwordHash: staffHash },
  });

  const academicYear = await prisma.academicYear.create({ data: { tenantId: tenant.id, label: '2025/2026' } });
  const term = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      label: 'Term 1',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
    },
  });

  const klass = await prisma.class.create({ data: { tenantId: tenant.id, name: 'JHS 2' } });

  const subjectMath = await prisma.subject.create({ data: { tenantId: tenant.id, name: 'Mathematics' } });
  const subjectEnglish = await prisma.subject.create({ data: { tenantId: tenant.id, name: 'English Language' } });

  await prisma.feeStructure.create({
    data: { tenantId: tenant.id, termId: term.id, amount: 500, label: 'JHS 2 - Term 1 fees' },
  });

  const student1 = await prisma.student.create({
    data: { tenantId: tenant.id, admissionNumber: 'DS-0001', fullName: 'Ama Owusu', email: 'ama.owusu@example.com' },
  });
  const student2 = await prisma.student.create({
    data: { tenantId: tenant.id, admissionNumber: 'DS-0002', fullName: 'Kwame Mensah' },
  });

  await prisma.enrollment.createMany({
    data: [
      { studentId: student1.id, classId: klass.id },
      { studentId: student2.id, classId: klass.id },
    ],
  });

  await prisma.studentFeeAccount.createMany({
    data: [
      { studentId: student1.id, totalCharged: 500 },
      { studentId: student2.id, totalCharged: 500 },
    ],
  });

  const guardian1 = await prisma.guardian.create({
    data: { tenantId: tenant.id, fullName: 'Mrs. Owusu', phone: '0244123456', email: 'mrs.owusu@example.com' },
  });
  await prisma.studentGuardian.create({ data: { studentId: student1.id, guardianId: guardian1.id, relation: 'Mother' } });

  const guardian2 = await prisma.guardian.create({
    data: { tenantId: tenant.id, fullName: 'Mr. Mensah', phone: '0201234567' },
  });
  await prisma.studentGuardian.create({ data: { studentId: student2.id, guardianId: guardian2.id, relation: 'Father' } });

  console.log('Demo School seeded: admin@demoschool.app / Admin123!, teacher@demoschool.app / Staff123!');
  console.log(`Subjects created: ${subjectMath.name}, ${subjectEnglish.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
