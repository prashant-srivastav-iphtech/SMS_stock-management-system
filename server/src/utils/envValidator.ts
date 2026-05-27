import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const durationRegex = /^(\d+)(ms|s|m|h|d)$/;

const envSchema = z.object({
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .regex(durationRegex, "JWT_ACCESS_EXPIRES_IN must be like 15m, 1h, 7d"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .regex(durationRegex, "JWT_REFRESH_EXPIRES_IN must be like 7d, 30d"),

  DB_NAME: z.string().min(1),

  DB_USER: z.string().min(1),

  DB_PASS: z.string().min(1),

  DB_HOST: z.string().min(1),

  DB_PORT: z.coerce.number().int().min(1).max(65535),

  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be strong"),

  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_/, "Invalid Stripe secret key"),

  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_/, "Invalid Stripe publishable key"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(/^whsec_/, "Invalid Stripe webhook secret"),

  RATE_LIMIT_AUTH: z.coerce.number().int().min(1).max(100),

  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000),

  PORT: z.coerce.number().int().min(1).max(65535),

  NODE_ENV: z.enum(["development", "production", "test"]), 
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\nInvalid environment variables:\n");

  console.table(
    parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );

  process.exit(1);
}

export const env = Object.freeze(parsed.data);
