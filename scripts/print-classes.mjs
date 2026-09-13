/**
 * scripts/print-classes.mjs — dump the class names/codes actually in the DB,
 * so generated seed data matches the real records exactly (no guessing).
 *
 * Run from the repo root:  node scripts/print-classes.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const classes = await prisma.class.findMany({
  select: { name: true, code: true, tenantId: true },
  orderBy: [{ tenantId: "asc" }, { name: "asc" }],
});

console.log(`Found ${classes.length} classes\n`);

for (const c of classes) {
  // Show the raw string with delimiters so invisible characters (non-breaking
  // spaces, odd dashes) are impossible to miss.
  console.log(`name=[${c.name}]  code=[${c.code}]`);
  console.log(
    `  charCodes(name)=${[...c.name].map((ch) => ch.charCodeAt(0)).join(",")}`,
  );
}

const tenants = new Map();
for (const c of classes)
  tenants.set(c.tenantId, (tenants.get(c.tenantId) || 0) + 1);
console.log(`\nTenants represented: ${tenants.size}`);
for (const [id, n] of tenants) console.log(`  ${id} -> ${n} classes`);

await prisma.$disconnect();
