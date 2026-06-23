import { Timestamp } from "firebase-admin/firestore";

export interface Tenant {
  tenantId: string;
  market: "dubai";
  region: "africa-west" | "mena";
  status: "trial" | "active" | "suspended" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;

  agent: {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    brokerage: string;
    preferredLanguage: string;
  };

  config: {
    currency: { code: string; symbol: string; locale: string };
    timezone: string;
    weekend: string[];
    dateFormat: string;
    compliance: {
      framework: "NDPR" | "RERA";
      consentRequired: boolean;
      auditRetentionYears: number;
    };
  };

  aiConfig: {
    personaName: string;
    greetingScript: string;
    handoffThreshold: number;
    qualificationQuestions: string[];
    languages: string[];
    features: {
      offPlanSupport: boolean;
      rentalYieldCalc: boolean;
      mobileMoney: boolean;
      ejariIntegration: boolean;
    };
    approvalMode: boolean;
  };

  integrations: {
    whatsapp: {
      enabled: boolean;
      phoneNumberId?: string;
      wabaId?: string;
      connectedAt?: Timestamp;
    };
    telegram?: {
      enabled: boolean;
      botToken?: string;
      botUsername?: string;
      connectedAt?: Timestamp;
    };
    vynn?: {
      enabled: boolean;
      apiKey?: string;
      model?: string;
      connectedAt?: Timestamp;
    };
    calendar: {
      google?: {
        enabled: boolean;
        connected?: boolean;
        refreshToken?: string;
        email?: string;
        connectedAt?: Timestamp;
      };
      outlook?: {
        enabled: boolean;
        connected?: boolean;
        refreshToken?: string;
        email?: string;
        connectedAt?: Timestamp;
      };
      preferred?: "google" | "outlook";
    };
    payments: {
      provider?: "stripe";
      customerId?: string;
      subscriptionId?: string;
      tier?: "solo" | "team" | "brokerage";
      currentPeriodEnd?: Timestamp;
    };
    crm: {
      webhooks?: Record<string, {
        enabled: boolean;
        apiKey: string;
        url: string;
      }>;
    };
  };

  usage: {
    leadsThisMonth: number;
    whatsappConversations: number;
    aiTokensConsumed: number;
    appointmentsBooked: number;
    lastResetAt: Timestamp;
  };

  team: {
    agents: Record<string, {
      name: string;
      email: string;
      role: "admin" | "agent";
      status: "active" | "invited" | "disabled";
      addedAt: Timestamp;
    }>;
  };
}
