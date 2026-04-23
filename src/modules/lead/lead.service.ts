import {
  Lead,
  LeadInterest,
  LeadTemperature,
  Prisma
} from "@prisma/client";

import { prisma } from "../../database/prisma/client";

export class LeadService {
  async upsertLead(
    clientId: string,
    data?: Partial<Pick<Lead, "interest" | "temperature">> & { notes?: Prisma.InputJsonValue }
  ): Promise<Lead> {
    return prisma.lead.upsert({
      where: { clientId },
      create: {
        clientId,
        interest: data?.interest ?? LeadInterest.UNKNOWN,
        temperature: data?.temperature ?? LeadTemperature.COLD,
        notes: data?.notes as Prisma.InputJsonValue | undefined
      },
      update: {
        interest: data?.interest,
        temperature: data?.temperature,
        notes: data?.notes as Prisma.InputJsonValue | undefined
      }
    });
  }
}
