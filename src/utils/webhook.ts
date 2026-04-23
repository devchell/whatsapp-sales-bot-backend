import { Request } from "express";

import { env } from "../config/env";

export function isValidWebhookSecret(request: Request): boolean {
  if (!env.WEBHOOK_SECRET) {
    return true;
  }

  const providedSecret =
    request.header("x-webhook-secret") ?? request.header("apikey") ?? request.query.secret;

  return providedSecret === env.WEBHOOK_SECRET;
}
