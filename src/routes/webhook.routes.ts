import { Router } from "express";

import { WhatsappController } from "../modules/whatsapp/whatsapp.controller";

const webhookController = new WhatsappController();

export const webhookRouter = Router();

webhookRouter.post("/whatsapp", webhookController.handleWebhook);
