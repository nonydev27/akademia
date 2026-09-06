/**
 * index.js — process entry point.
 */

import 'dotenv/config';
import { env } from './config/env.js';
import app from './app.js';
import prisma, { connectDb } from './config/db.js';
import logger from './utils/logger.js';

async function main() {
  try {
    await connectDb();
    logger.info('Connected to the database');
  } catch (err) {
    logger.error('Failed to connect to the database', { message: err.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Akademia API listening on port ${env.PORT}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
