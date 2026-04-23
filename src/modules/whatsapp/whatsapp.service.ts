import { z } from "zod";

import { env } from "../../config/env";
import { logger } from "../../utils/logger";

const outboundMessageSchema = z.object({
  phone: z.string().min(10).max(15),
  message: z.string().min(1).max(1000)
});

export type SendWhatsappMessageInput = z.infer<typeof outboundMessageSchema>;

export class WhatsappService {
  private readonly endpoint = `${env.ZAPI_BASE_URL}/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_INSTANCE_TOKEN}/send-text`;

  async sendMessage(input: SendWhatsappMessageInput) {
    const payload = outboundMessageSchema.parse(input);

    if (!env.WHATSAPP_SEND_ENABLED) {
      logger.info("WhatsApp send disabled; response mocked.", { payload });
      return {
        success: true,
        mocked: true,
        payload
      };
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": env.ZAPI_CLIENT_TOKEN
      },
      body: JSON.stringify({
        phone: payload.phone,
        message: payload.message
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to send WhatsApp message: ${response.status} - ${body}`);
    }

    return response.json();
  }
}
