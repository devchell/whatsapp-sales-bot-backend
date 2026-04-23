import { Client } from "@prisma/client";

import { prisma } from "../../database/prisma/client";

export class ClientService {
  async findByPhone(phone: string): Promise<Client | null> {
    return prisma.client.findUnique({ where: { phone } });
  }

  async findOrCreateByPhone(phone: string): Promise<Client> {
    const existingClient = await this.findByPhone(phone);

    if (existingClient) {
      return existingClient;
    }

    return prisma.client.create({
      data: {
        phone
      }
    });
  }

  async markConsent(clientId: string): Promise<Client> {
    return prisma.client.update({
      where: { id: clientId },
      data: { consentGiven: true }
    });
  }

  async updateName(clientId: string, name: string): Promise<Client> {
    return prisma.client.update({
      where: { id: clientId },
      data: { name }
    });
  }
}
