import { LeadInterest } from "@prisma/client";

type IntentMatch = {
  interest: LeadInterest;
  confidence: number;
};

const intentRules: Array<{ interest: LeadInterest; patterns: RegExp[] }> = [
  {
    interest: LeadInterest.LANDING_PAGE,
    patterns: [/landing/i, /\bsite\b/i, /\bpagina\b/i, /\bquero.*site\b/i]
  },
  {
    interest: LeadInterest.AUTOMACAO,
    patterns: [/automacao/i, /whats/i, /bot/i, /atendimento/i]
  },
  {
    interest: LeadInterest.SISTEMA,
    patterns: [/sistema/i, /crm/i, /gesta[oã]/i, /processo/i]
  },
  {
    interest: LeadInterest.IA,
    patterns: [/\bia\b/i, /inteligencia artificial/i, /agente/i, /assistente/i]
  },
  {
    interest: LeadInterest.AJUDA,
    patterns: [/ajuda/i, /nao sei/i, /me orienta/i]
  }
];

export class IntentDetector {
  detect(message: string): IntentMatch {
    const matches = intentRules
      .map((rule) => ({
        interest: rule.interest,
        confidence: rule.patterns.filter((pattern) => pattern.test(message)).length / rule.patterns.length
      }))
      .filter((rule) => rule.confidence > 0)
      .sort((left, right) => right.confidence - left.confidence);

    return matches[0] ?? { interest: LeadInterest.UNKNOWN, confidence: 0 };
  }
}
