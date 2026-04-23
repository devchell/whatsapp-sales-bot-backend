import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_INSTANCE: z.string().min(1, "EVOLUTION_INSTANCE is required"),
  EVOLUTION_API_KEY: z.string().min(1, "EVOLUTION_API_KEY is required"),
  DEFAULT_COUNTRY_CODE: z.string().regex(/^\d{1,4}$/).default("55"),
  WEBHOOK_SECRET: z.string().min(1).optional(),
  EVOLUTION_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`
  );
}

export const env = parsedEnv.data;
