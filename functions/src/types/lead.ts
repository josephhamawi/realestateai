import { Timestamp } from "firebase-admin/firestore";

export interface Lead {
  leadId: string;
  tenantId: string;
  market: "dubai";
  source:
    | "whatsapp"
    | "telegram"
    | "manual"
    | "property_finder"
    | "bayut"
    | "referral"
    | "other";
  status:
    | "new"
    | "contacted"
    | "qualified"
    | "appointment_set"
    | "closed"
    | "dead";
  createdAt: Timestamp;
  updatedAt: Timestamp;

  contact: {
    name: string;
    phone: string;
    email?: string;
    preferredLanguage: string;
    whatsappProfileName?: string;
    telegramChatId?: string;
    telegramUsername?: string;
  };

  propertyInterest: {
    budgetMin: number;
    budgetMax: number;
    currency: "AED";
    timeline: string;
    propertyType: string;
    desiredAreas: string[];
    dubaiSpecific?: {
      offPlan: boolean;
      handoverDate?: string;
      freehold: boolean;
      investmentType: "primary_residence" | "investment" | "holiday_home";
      targetYield?: number;
      islamicFinance: boolean;
    };
  };

  qualification: {
    score: number;
    status: "unqualified" | "qualifying" | "qualified" | "disqualified";
    urgency: "hot" | "warm" | "cold";
    readiness: {
      budgetConfirmed: boolean;
      timelineConfirmed: boolean;
      propertyTypeConfirmed: boolean;
      areaConfirmed: boolean;
      agentReady: boolean;
    };
    escalation?: {
      triggered: boolean;
      reason: string;
      reasonCode: string;
      timestamp: Timestamp;
    };
    summary?: string;
  };

  conversation: {
    threadId: string;
    channel: "whatsapp" | "telegram" | "manual";
    lastMessageAt: Timestamp;
    messageCount: number;
    aiActive: boolean;
    languageDetected?: string;
    windowExpiresAt?: Timestamp;
  };

  appointment?: {
    appointmentId: string;
    scheduledAt: Timestamp;
    status: string;
  };

  consent?: {
    given: boolean;
    timestamp: Timestamp;
    method: "whatsapp_reply" | "telegram_reply";
    text: string;
  };

  notes?: string;
}
