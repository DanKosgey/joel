import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MT5_WEBHOOK_URL: z.string().url(),
  MT5_WEBHOOK_SECRET: z.string().min(1),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  CRON_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  const missingVars = Object.entries(errors)
    .map(([key, val]) => `  - ${key}: ${val?.join(", ")}`)
    .join("\n");

  console.error(
    `❌ Invalid or missing environment variables:\n${missingVars}\n`
  );
  throw new Error("Missing required environment variables. See above for details.");
}

export const env = result.data;
