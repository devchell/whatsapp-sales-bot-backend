import { env } from "../config/env";

export function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Invalid phone number format");
  }

  if (digits.startsWith(env.DEFAULT_COUNTRY_CODE)) {
    return digits;
  }

  return `${env.DEFAULT_COUNTRY_CODE}${digits}`;
}
