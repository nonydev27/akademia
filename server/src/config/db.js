/**
 * config/db.js — Prisma client singleton.
 *
 * TODO:
 * - Instantiate a single `PrismaClient` and export it. Never instantiate
 *   PrismaClient anywhere else in the codebase — always import from here.
 * - In development, attach the client to `globalThis` to avoid creating a new
 *   client on every hot-reload (standard Prisma + nodemon pattern).
 * - Consider enabling Prisma logging (`log: ['warn', 'error']`, add 'query' only
 *   when debugging) via env.NODE_ENV.
 * - This is also the natural place to add a `connectDb()` helper that
 *   index.js can call at boot to fail fast if the database is unreachable.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDb() {
  await prisma.$connect();
}

export default prisma;
