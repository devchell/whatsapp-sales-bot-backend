import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ZAPI_BASE_URL: z.string().url(),
  ZAPI_INSTANCE_ID: z.string().min(1),
  ZAPI_INSTANCE_TOKEN: z.string().min(1),
  ZAPI_CLIENT_TOKEN: z.string().min(1),
  DEFAULT_COUNTRY_CODE: z.string().regex(/^\d{1,4}$/).default("55"),
  WHATSAPP_SEND_ENABLED: z
    .string()
    .transform((value) => value === "true")
    .default("false")
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
