import {
  ConversationState,
  LeadInterest,
  LeadTemperature,
  Prisma
} from "@prisma/client";

export type QualificationStep = {
  key: string;
  prompt: string;
};

export type ConversationContext = {
  consentRequested?: boolean;
  qualification?: {
    interest?: LeadInterest;
    currentQuestionIndex?: number;
    answers?: Record<string, string>;
  };
};

export type FlowResolution = {
  nextState: ConversationState;
  reply: string;
  leadInterest?: LeadInterest;
  leadTemperature?: LeadTemperature;
  context: ConversationContext;
};

const menuMessage = `Ola!\n\nMe conta, o que voce esta buscando hoje?\n\n1 - Landing page\n2 - Automacao WhatsApp\n3 - Sistema\n4 - IA\n5 - Ajuda`;

const qualificationMap: Record<LeadInterest, QualificationStep[]> = {
  LANDING_PAGE: [
    { key: "nicho", prompt: "Perfeito. Qual e o seu nicho hoje?" },
    { key: "vende_hoje", prompt: "Voce ja vende hoje ou ainda esta estruturando a oferta?" },
    { key: "trafego_pago", prompt: "Voce usa trafego pago hoje para gerar demanda?" }
  ],
  AUTOMACAO: [
    { key: "perde_mensagens", prompt: "Hoje voce perde mensagens ou demora para responder clientes?" },
    { key: "volume_atendimento", prompt: "Quantos clientes, em media, voce atende por dia?" },
    { key: "objetivo", prompt: "Seu foco principal e vender mais, organizar atendimento ou reativar leads?" }
  ],
  SISTEMA: [
    { key: "dor_principal", prompt: "Voce precisa organizar processo interno, operacionalizar vendas ou os dois?" },
    { key: "equipe", prompt: "Quantas pessoas usam ou usariam esse sistema no dia a dia?" },
    { key: "integracoes", prompt: "Existe alguma ferramenta que precisa integrar obrigatoriamente?" }
  ],
  IA: [
    { key: "caso_uso", prompt: "Como voce imagina usar IA no negocio hoje?" },
    { key: "time", prompt: "Seu time usaria IA em atendimento, vendas, operacao ou marketing?" },
    { key: "meta", prompt: "Qual resultado voce espera gerar com IA nos proximos 90 dias?" }
  ],
  AJUDA: [
    { key: "cenario", prompt: "Sem problema. Me resume seu cenario atual em uma frase?" },
    { key: "meta", prompt: "Qual e a principal meta que voce quer atingir agora?" },
    { key: "urgencia", prompt: "Isso e urgente para este mes ou voce esta pesquisando opcoes?" }
  ],
  UNKNOWN: [
    { key: "objetivo", prompt: "Me conta rapidamente qual objetivo voce quer atingir com o projeto." }
  ]
};

function interestToState(interest: LeadInterest): ConversationState {
  switch (interest) {
    case LeadInterest.LANDING_PAGE:
      return ConversationState.LANDING_PAGE;
    case LeadInterest.AUTOMACAO:
      return ConversationState.AUTOMACAO;
    case LeadInterest.SISTEMA:
      return ConversationState.SISTEMA;
    case LeadInterest.IA:
      return ConversationState.IA;
    case LeadInterest.AJUDA:
      return ConversationState.QUALIFICACAO;
    default:
      return ConversationState.MENU;
  }
}

function determineLeadTemperature(answers: Record<string, string>): LeadTemperature {
  const combined = Object.values(answers).join(" ").toLowerCase();
  const hotSignals = ["urgente", "hoje", "imediato", "muitos", "alto", "vendas", "trafego"];
  const warmSignals = ["planejando", "organizar", "melhorar", "crescer"];

  if (hotSignals.some((signal) => combined.includes(signal))) {
    return LeadTemperature.HOT;
  }

  if (warmSignals.some((signal) => combined.includes(signal))) {
    return LeadTemperature.WARM;
  }

  return LeadTemperature.COLD;
}

export class FlowEngine {
  getWelcomeMessage(): string {
    return menuMessage;
  }

  beginFlow(interest: LeadInterest, existingContext?: ConversationContext): FlowResolution {
    const questions = qualificationMap[interest] ?? qualificationMap.UNKNOWN;
    const context: ConversationContext = {
      ...existingContext,
      qualification: {
        interest,
        currentQuestionIndex: 0,
        answers: {}
      }
    };

    return {
      nextState: interestToState(interest),
      reply: questions[0].prompt,
      leadInterest: interest,
      context
    };
  }

  continueQualification(currentContext: ConversationContext, answer: string): FlowResolution {
    const qualification = currentContext.qualification;
    const interest = qualification?.interest ?? LeadInterest.UNKNOWN;
    const questions = qualificationMap[interest] ?? qualificationMap.UNKNOWN;
    const currentQuestionIndex = qualification?.currentQuestionIndex ?? 0;
    const currentQuestion = questions[currentQuestionIndex];
    const answers = {
      ...(qualification?.answers ?? {}),
      ...(currentQuestion ? { [currentQuestion.key]: answer } : {})
    };
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex >= questions.length) {
      return {
        nextState: ConversationState.FINAL,
        reply:
          "Perfeito. Ja entendi o seu contexto e consigo te direcionar para a melhor solucao. Se quiser, eu posso seguir com um resumo do que faz mais sentido para o seu caso.",
        leadInterest: interest,
        leadTemperature: determineLeadTemperature(answers),
        context: {
          ...currentContext,
          qualification: {
            interest,
            currentQuestionIndex: nextQuestionIndex,
            answers
          }
        }
      };
    }

    return {
      nextState: interestToState(interest),
      reply: questions[nextQuestionIndex].prompt,
      leadInterest: interest,
      context: {
        ...currentContext,
        qualification: {
          interest,
          currentQuestionIndex: nextQuestionIndex,
          answers
        }
      }
    };
  }

  serializeContext(context: ConversationContext): Prisma.JsonObject {
    return context as Prisma.JsonObject;
  }

  deserializeContext(context: Prisma.JsonValue | null): ConversationContext {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      return {};
    }

    return context as ConversationContext;
  }
}
