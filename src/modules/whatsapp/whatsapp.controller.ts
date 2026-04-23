import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ChatbotService } from "../chatbot/chatbot.service";
import { AppError } from "../../utils/http-errors";
import { isValidWebhookSecret } from "../../utils/webhook";
import { EvolutionService } from "./evolution.service";

const webhookPayloadSchema = z
  .object({
    event: z.string().optional(),
    data: z
      .object({
        key: z
          .object({
            remoteJid: z.string().optional(),
            fromMe: z.boolean().optional()
          })
          .optional(),
        message: z
          .object({
            conversation: z.string().optional(),
            extendedTextMessage: z
              .object({
                text: z.string().optional()
              })
              .optional()
          })
          .optional()
      })
      .optional(),
    key: z
      .object({
        remoteJid: z.string().optional(),
        fromMe: z.boolean().optional()
      })
      .optional(),
    message: z
      .object({
        conversation: z.string().optional(),
        extendedTextMessage: z
          .object({
            text: z.string().optional()
          })
          .optional()
      })
      .optional(),
    messageType: z.string().optional()
  })
  .passthrough();

export class WhatsappController {
  constructor(
    private readonly chatbotService = new ChatbotService(),
    private readonly evolutionService = new EvolutionService()
  ) {}

  handleWebhook = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = webhookPayloadSchema.parse(request.body);
      if (!isValidWebhookSecret(request)) {
        throw new AppError(401, "Invalid webhook secret");
      }

      const source = payload.data ?? payload;
      const remoteJid = source.key?.remoteJid;
      const phone = remoteJid?.replace(/\D/g, "");
      const message =
        source.message?.conversation ?? source.message?.extendedTextMessage?.text;
      const fromMe = source.key?.fromMe ?? false;
      const isGroupMessage = remoteJid?.includes("@g.us") ?? false;

      if (fromMe || isGroupMessage || !phone || !message) {
        response.status(202).json({
          status: "ignored",
          reason: "unsupported_or_outbound_event"
        });
        return;
      }

      const chatbotResponse = await this.chatbotService.processMessage({
        phone,
        message
      });

      const delivery = await this.evolutionService.sendMessage({
        number: phone,
        text: chatbotResponse.reply
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
