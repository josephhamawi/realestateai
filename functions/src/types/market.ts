export interface MarketConfig {
  marketId: "nigeria" | "dubai";
  displayName: string;
  region: "africa-west" | "mena";
  currency: {
    code: "NGN" | "AED";
    symbol: string;
    locale: string;
  };
  timezone: "Africa/Lagos" | "Asia/Dubai";
  weekend: string[];
  dateFormat: string;
  compliance: {
    framework: "NDPR" | "RERA";
    consentRequired: boolean;
    auditRetentionYears: number;
    blockedPhrases: string[];
  };
  ai: {
    defaultPersona: string;
    systemPromptTemplate: string;
    qualificationQuestions: string[];
    escalationTriggers: string[];
  };
  whatsapp: {
    utilityRate: number;
    marketingRate: number;
  };
  subscriptionTiers: {
    solo: { price: number; leadsPerMonth: number; maxAgents: number };
    team: { price: number; leadsPerMonth: number; maxAgents: number };
    brokerage: { price: number; leadsPerMonth: number; maxAgents: number };
  };
  phonePrefix: string;
  areas: string[];
  propertyTypes: string[];
  culturalBlocks: {
    enabled: boolean;
    blocks: Array<{
      day: string;
      start: string;
      end: string;
      reason: string;
    }>;
  };
}
