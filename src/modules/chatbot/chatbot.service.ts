import { ConversationState, LeadInterest, MessageRole } from "@prisma/client";

import { ClientService } from "../client/client.service";
import { LeadService } from "../lead/lead.service";
import { sanitizeText } from "../../utils/message";
import { normalizePhone } from "../../utils/phone";
import { FlowEngine } from "./flow-engine";
import { IntentDetector } from "./intent-detector";
import { StateManager } from "./state-manager";

export type InboundMessageInput = {
  phone: string;
  message: string;
};

export type ChatbotResponse = {
  reply: string;
  state: ConversationState;
  clientId: string;
  conversationId: string;
};

export class ChatbotService {
  constructor(
    private readonly clientService = new ClientService(),
    private readonly stateManager = new StateManager(),
    private readonly flowEngine = new FlowEngine(),
    private readonly intentDetector = new IntentDetector(),
    private readonly leadService = new LeadService()
  ) {}

  async processIncomingMessage(input: InboundMessageInput): Promise<ChatbotResponse> {
    const phone = normalizePhone(input.phone);
    const message = sanitizeText(input.message);

    const client = await this.clientService.findOrCreateByPhone(phone);
    const conversation = await this.stateManager.getOrCreateConversation(client.id);
    const context = this.flowEngine.deserializeContext(conversation.context);

    await this.stateManager.saveMessage(conversation.id, MessageRole.USER, message);

    let flowResult;

    if (!client.consentGiven) {
      await this.clientService.markConsent(client.id);
    }

    if (conversation.state === ConversationState.START) {
      flowResult = {
        nextState: ConversationState.MENU,
        reply: this.flowEngine.getWelcomeMessage(),
        context
      };
    } else if (conversation.state === ConversationState.MENU) {
      const mappedInterest = this.resolveInterest(message);
      flowResult = this.flowEngine.beginFlow(mappedInterest, context);
    } else if (
      conversation.state === ConversationState.LANDING_PAGE ||
      conversation.state === ConversationState.AUTOMACAO ||
      conversation.state === ConversationState.SISTEMA ||
      conversation.state === ConversationState.IA ||
      conversation.state === ConversationState.QUALIFICACAO
    ) {
      flowResult = this.flowEngine.continueQualification(context, message);
    } else {
      flowResult = {
        nextState: ConversationState.MENU,
        reply: this.flowEngine.getWelcomeMessage(),
        context: {}
      };
    }

    await this.stateManager.updateState(
      conversation.id,
      flowResult.nextState,
      this.flowEngine.serializeContext(flowResult.context)
    );

    if (flowResult.leadInterest || flowResult.leadTemperature) {
      await this.leadService.upsertLead(client.id, {
        interest: flowResult.leadInterest,
        temperature: flowResult.leadTemperature,
        notes: flowResult.context.qualification?.answers
      });
    }

    await this.stateManager.saveMessage(conversation.id, MessageRole.BOT, flowResult.reply);

    return {
      reply: flowResult.reply,
      state: flowResult.nextState,
      clientId: client.id,
      conversationId: conversation.id
    };
  }

  private resolveInterest(message: string): LeadInterest {
    const normalizedMessage = message.toLowerCase();
    const optionMap: Record<string, LeadInterest> = {
      "1": LeadInterest.LANDING_PAGE,
      "2": LeadInterest.AUTOMACAO,
      "3": LeadInterest.SISTEMA,
      "4": LeadInterest.IA,
      "5": LeadInterest.AJUDA
    };

    if (optionMap[normalizedMessage]) {
      return optionMap[normalizedMessage];
    }

    return this.intentDetector.detect(normalizedMessage).interest;
  }
}
