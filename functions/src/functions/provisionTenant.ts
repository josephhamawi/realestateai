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
    currency: "AED",
    currencySymbol: "AED",
    region: "mena",
    timezone: "Asia/Dubai",
    weekend: ["friday", "saturday"],
    dateFormat: "DD/MM/YYYY",
    compliance: { gdpr: false, difc: true, rera: true },
    ai: { defaultPersona: "Aisha", qualificationQuestions: [] },
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
    status: "trial",
    config: {
      currency: marketConfig.currency,
      timezone: marketConfig.timezone,
      weekend: marketConfig.weekend,
      dateFormat: marketConfig.dateFormat,
      compliance: marketConfig.compliance,
    },
    aiConfig: {
      personaName: aiDefaults.defaultPersona || "Aisha",
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
      payments: {},
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
