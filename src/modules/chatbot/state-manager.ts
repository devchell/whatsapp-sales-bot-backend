import { Conversation, ConversationState, Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma/client";

export class StateManager {
  async getOrCreateConversation(clientId: string): Promise<Conversation> {
    const existingConversation = await prisma.conversation.findFirst({
      where: { clientId },
      orderBy: { updatedAt: "desc" }
    });

    if (existingConversation) {
      return existingConversation;
    }

    return prisma.conversation.create({
      data: {
        clientId,
        state: ConversationState.START
      }
    });
  }

  async updateState(
    conversationId: string,
    state: ConversationState,
    context?: Prisma.InputJsonValue
  ): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        state,
        context
      }
    });
  }

  async saveMessage(conversationId: string, role: "USER" | "BOT", content: string) {
    return prisma.message.create({
      data: {
        conversationId,
        role,
        content
      }
    });
  }
}
