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
        // Append connection timeout in case the URL doesn't already have it.
        // If the env var already has connect_timeout this is a no-op (Prisma
        // merges query params, so duplication is safe).
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * connectDb — called once at server startup.
 * Retries up to 5 times with exponential back-off so a cold Supabase pooler
 * doesn't prevent the server from starting.
 */
export async function connectDb(retries = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      return; // success
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = delayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s …
      // eslint-disable-next-line no-console
      console.warn(`DB connect attempt ${attempt} failed (${err.message}). Retrying in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

export default prisma;
