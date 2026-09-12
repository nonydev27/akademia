// Verify the new codes exist on the real data.
import "dotenv/config";
import prisma from "./src/config/db.js";

(async () => {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, code: true, studentSeq: true },
  });
  console.log("\nTENANTS:");
  for (const t of tenants)
    console.log(`  code=${t.code}  seq=${t.studentSeq}  name=${t.name}`);

  const classes = await prisma.class.findMany({
    select: { name: true, code: true, tenantId: true },
  });
  console.log("\nCLASSES:");
  for (const c of classes) console.log(`  code=${c.code}  name=${c.name}`);

  const students = await prisma.student.findMany({
    select: { admissionNumber: true, fullName: true },
  });
  console.log("\nSTUDENTS:");
  for (const s of students)
    console.log(`  id=${s.admissionNumber}  ${s.fullName}`);

  await prisma.$disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
