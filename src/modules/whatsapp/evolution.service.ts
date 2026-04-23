import { z } from "zod";

import { env } from "../../config/env";
import { AppError } from "../../utils/http-errors";

const sendMessageSchema = z.object({
  number: z.string().min(10).max(15),
  text: z.string().min(1).max(1000)
});

export type SendEvolutionMessageInput = z.infer<typeof sendMessageSchema>;

export class EvolutionService {
  private readonly endpoint = `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE}`;

  async sendMessage(input: SendEvolutionMessageInput) {
    const payload = sendMessageSchema.parse(input);

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: payload.number,
        textMessage: {
          text: payload.text
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new AppError(502, "Failed to send message via Evolution API", {
        status: response.status,
        body: errorBody
      });
    }

    return response.json();
  }
}
