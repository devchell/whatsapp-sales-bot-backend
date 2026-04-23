import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ChatbotService } from "../chatbot/chatbot.service";
import { WhatsappService } from "./whatsapp.service";

const webhookPayloadSchema = z.object({
  phone: z.string().optional(),
  text: z.string().optional(),
  message: z
    .object({
      text: z.string().optional()
    })
    .optional(),
  sender: z
    .object({
      phone: z.string().optional()
    })
    .optional()
});

export class WhatsappController {
  constructor(
    private readonly chatbotService = new ChatbotService(),
    private readonly whatsappService = new WhatsappService()
  ) {}

  handleWebhook = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = webhookPayloadSchema.parse(request.body);
      const phone = payload.phone ?? payload.sender?.phone;
      const message = payload.text ?? payload.message?.text;

      if (!phone || !message) {
        response.status(202).json({
          status: "ignored",
          reason: "payload_without_supported_text_message"
        });
        return;
      }

      const chatbotResponse = await this.chatbotService.processIncomingMessage({
        phone,
        message
      });

      const delivery = await this.whatsappService.sendMessage({
        phone,
        message: chatbotResponse.reply
      });

      response.status(200).json({
        status: "processed",
        chatbot: chatbotResponse,
        delivery
      });
    } catch (error) {
      next(error);
    }
  };
}
