import { z } from 'zod';

/**
 * Server-side environment validation. Import ONLY from server code
 * (route handlers, server components, server actions, lib server modules).
 *
 * Required vars must be present (see .env.example). Integration credentials
 * (Mercado Pago, Resend, crypto) are optional here and validated lazily by the
 * adapter that needs them, so a build/boot doesn't fail when an integration
 * isn't configured yet.
 */
const schema = z.object({
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 chars'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required'),

  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),

  CRYPTO_PROVIDER: z.enum(['nowpayments', 'bitso']).default('nowpayments'),
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Autos MX <no-reply@example.com>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),

  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

/** Read an optional integration credential, throwing a clear error if missing. */
export function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
