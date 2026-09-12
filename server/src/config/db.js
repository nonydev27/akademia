/**
 * config/db.js — Prisma client singleton.
 *
 * Supabase free-tier pgBouncer notes:
 *  - connection_limit=1 in DATABASE_URL is required — pgBouncer transaction mode
 *    does not support multiple simultaneous connections from one client.
 *  - The pooler can take 1-2 seconds to wake on a cold start; Prisma's default
 *    connection timeout (5 s) is sometimes too short. We raise it to 20 s.
 *  - In development, attach the client to globalThis to avoid creating a new
 *    connection pool on every hot-reload (standard Prisma + nodemon pattern).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * connectDb — called once at server startup.
 * Retries up to 3 times with shorter intervals so a cold Supabase pooler
 * doesn't block the server for too long.
 */
export async function connectDb(retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = delayMs * attempt; // 1s, 2s, 3s (faster backoff)
      console.warn(`DB connect attempt ${attempt} failed (${err.message}). Retrying in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

export default prisma;
