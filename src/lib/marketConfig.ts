export type MarketId = "nigeria" | "dubai";

export interface MarketDefaults {
  marketId: MarketId;
  displayName: string;
  currency: { code: string; symbol: string; locale: string };
  timezone: string;
  phonePrefix: string;
  areas: string[];
  propertyTypes: string[];
  weekend: string[];
}

export const MARKET_DEFAULTS: Record<MarketId, MarketDefaults> = {
  nigeria: {
    marketId: "nigeria",
    displayName: "Nigeria",
    currency: { code: "NGN", symbol: "\u20A6", locale: "en-NG" },
    timezone: "Africa/Lagos",
    phonePrefix: "+234",
    areas: [
      "Lekki Phase 1", "Lekki Phase 2", "Ikoyi", "Victoria Island", "Ajah",
      "Banana Island", "Ikeja GRA", "Magodo", "Surulere",
      "Maitama", "Asokoro", "Gwarinpa", "Wuse",
    ],
    propertyTypes: ["apartment", "detached_house", "semi_detached", "terrace", "land", "commercial", "office"],
    weekend: ["sat", "sun"],
  },
  dubai: {
    marketId: "dubai",
    displayName: "Dubai",
    currency: { code: "AED", symbol: "AED", locale: "en-AE" },
    timezone: "Asia/Dubai",
    phonePrefix: "+971",
    areas: [
      "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "JVC", "JBR",
      "Business Bay", "Arabian Ranches", "Dubai Hills", "DIFC",
      "Al Barsha", "Jumeirah", "Dubai Creek Harbour",
    ],
    propertyTypes: ["apartment", "villa", "townhouse", "penthouse", "studio", "commercial", "office"],
    weekend: ["fri", "sat"],
  },
};

export const LEAD_STATUSES = [
  "new", "contacted", "qualified", "appointment_set", "closed", "dead",
] as const;

export const URGENCY_LEVELS = ["hot", "warm", "cold"] as const;

export const LEAD_SOURCES = [
  "whatsapp", "manual", "property_finder", "bayut",
  "nigerian_property_centre", "referral", "other",
] as const;

export const APPOINTMENT_TYPES = [
  "property_viewing", "buyer_consultation", "valuation", "video_call", "other",
] as const;

export const SUBSCRIPTION_TIERS = ["solo", "team", "brokerage"] as const;
