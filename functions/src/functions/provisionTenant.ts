import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, authAdmin, FieldValue, Timestamp } from "../config/firebase";

export const provisionTenant = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const uid = request.auth.uid;
  const market = "dubai";

  // Check if tenant already exists
  const existingTenant = await db.doc(`tenants/${uid}`).get();
  if (existingTenant.exists) {
    throw new HttpsError("already-exists", "Tenant already provisioned");
  }

  // Load Dubai defaults (fallback to hardcoded if not seeded yet)
  const marketConfigSnap = await db.doc(`market_config/${market}`).get();
  const marketDefaults: Record<string, unknown> = {
    currency: { code: "AED", symbol: "AED", locale: "en-AE" },
    region: "mena",
    timezone: "Asia/Dubai",
    weekend: ["friday", "saturday"],
    dateFormat: "DD/MM/YYYY",
    compliance: { gdpr: false, difc: true, rera: true },
    ai: { defaultPersona: "Noor", qualificationQuestions: [] },
  };
  const marketConfig = marketConfigSnap.exists
    ? marketConfigSnap.data()!
    : marketDefaults;

  // Seed market_config if it doesn't exist yet
  if (!marketConfigSnap.exists) {
    await db.doc(`market_config/${market}`).set(marketConfig);
  }

  const aiDefaults = (marketConfig.ai as Record<string, unknown>) || {};

  // Create tenant document
  await db.doc(`tenants/${uid}`).set({
    tenantId: uid,
    market,
    region: marketConfig.region,
    status: "active",
    config: {
      // The dashboard formats money with Intl.NumberFormat, so currency must be
      // the {code, symbol, locale} shape. Older market_config documents stored a
      // bare string, so normalize here.
      currency: normalizeCurrency(marketConfig.currency),
      timezone: marketConfig.timezone,
      weekend: marketConfig.weekend,
      dateFormat: marketConfig.dateFormat,
      compliance: marketConfig.compliance,
    },
    aiConfig: {
      personaName: aiDefaults.defaultPersona || "Noor",
      greetingScript: "",
      handoffThreshold: 60,
      qualificationQuestions: aiDefaults.qualificationQuestions || [],
      languages: ["en"],
      features: {
        offPlanSupport: true,
        rentalYieldCalc: true,
        mobileMoney: false,
        ejariIntegration: true,
      },
      approvalMode: false,
    },
    integrations: {
      whatsapp: { enabled: false },
      calendar: {},
      crm: { webhooks: {} },
    },
    usage: {
      leadsThisMonth: 0,
      whatsappConversations: 0,
      aiTokensConsumed: 0,
      appointmentsBooked: 0,
      lastResetAt: Timestamp.now(),
    },
    team: { agents: {} },
    agent: {
      name: "",
      email: request.auth.token.email || "",
      phone: "",
      licenseNumber: "",
      brokerage: "",
      preferredLanguage: "en",
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Set custom claims
  await authAdmin.setCustomUserClaims(uid, {
    tenantId: uid,
    role: "admin",
    market,
  });

  return { success: true, tenantId: uid };
});

interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "AED",
  symbol: "AED",
  locale: "en-AE",
};

function normalizeCurrency(value: unknown): CurrencyConfig {
  if (typeof value === "string" && value.length > 0) {
    return { ...DEFAULT_CURRENCY, code: value, symbol: value };
  }
  if (value && typeof value === "object") {
    const v = value as Partial<CurrencyConfig>;
    if (v.code) {
      return {
        code: v.code,
        symbol: v.symbol || v.code,
        locale: v.locale || DEFAULT_CURRENCY.locale,
      };
    }
  }
  return DEFAULT_CURRENCY;
}
