/**
 * middleware/error.middleware.js — single place that formats all errors.
 */

import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export function errorMiddleware(err, req, res, next) {
  let statusCode = 500;
  let publicMessage = 'Something went wrong. Please try again.';
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    publicMessage = err.publicMessage;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    publicMessage = 'Validation failed';
    details = err.flatten();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      statusCode = 404;
      publicMessage = 'Resource not found';
    } else if (err.code === 'P2002') {
      statusCode = 409;
      publicMessage = 'A record with that value already exists';
      details = { fields: err.meta?.target };
    }
  }

  logger.error(err.message, {
    statusCode,
    tenantId: req.tenantId,
    userId: req.user?.id,
    stack: err.stack,
  });

  res.status(statusCode).json({
    message: publicMessage,
    ...(details ? { details } : {}),
  });
}
