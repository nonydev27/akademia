/**
 * config/env.js — centralizes and validates process.env access.
 */

import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  RESEND_API_KEY: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Akademia <no-reply@akademia.app>'),

  SMS_PROVIDER: z.enum(['arkesel', 'hubtel']).default('arkesel'),
  ARKESEL_API_KEY: z.string().optional().default(''),
  HUBTEL_CLIENT_ID: z.string().optional().default(''),
  HUBTEL_CLIENT_SECRET: z.string().optional().default(''),
  SMS_SENDER_ID: z.string().default('Akademia'),

  PAYMENT_PROVIDER: z.enum(['paystack', 'flutterwave']).default('paystack'),
  PAYSTACK_SECRET_KEY: z.string().optional().default(''),
  FLUTTERWAVE_SECRET_KEY: z.string().optional().default(''),

  SUBSCRIPTION_GRACE_PERIOD_DAYS: z.coerce.number().int().min(7).max(14).default(14),

  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional().default('superadmin@akademia.app'),
  SEED_SUPER_ADMIN_PASSWORD: z.string().optional().default('ChangeMe123!'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
