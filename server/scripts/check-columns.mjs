import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const columns = ['Tenant.slogan', 'Tenant.schoolLevel', 'Tenant.code', 'Tenant.studentSeq', 'Tenant.adminContact', 'Tenant.adminPhone', 'Tenant.createdAt', 'User.image', 'User.phone', 'User.active', 'User.email', 'User.fullName', 'User.role', 'User.tenantId', 'User.supabaseId', 'Student.address', 'Student.clubs', 'Student.gender', 'Student.nationality', 'Student.nhisNumber', 'Student.otherActivities', 'Student.phone', 'Student.previousSchool', 'Student.profilePicUrl', 'Student.religion', 'Student.sports'];
  console.log('Done');
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
