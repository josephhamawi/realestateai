# AgentFlow AI - Technical Architecture Document

**Author:** joseph
**Date:** 2026-04-07
**Status:** Implementation-Ready
**Firebase Project:** `agentflowai-11dd2`

---

## Table of Contents

1. [System Overview & Component Diagram](#1-system-overview--component-diagram)
2. [Firestore Collection Schemas](#2-firestore-collection-schemas)
3. [Cloud Functions Specification](#3-cloud-functions-specification)
4. [API Endpoint Definitions](#4-api-endpoint-definitions)
5. [Authentication & Authorization Model](#5-authentication--authorization-model)
6. [Integration Architecture](#6-integration-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Environment Configuration & Firebase Config](#11-environment-configuration--firebase-config)

---

## 1. System Overview & Component Diagram

### Architecture Philosophy

AgentFlow AI follows a **serverless, event-driven architecture** built entirely on Firebase/Google Cloud. Every component runs as a managed service -- no VMs, no containers, no Kubernetes. Market-specific behavior is resolved at runtime via the `market` field on tenant documents, not through code forks or separate deployments.

**Core Principles:**
- Single codebase, single deployment, multi-market behavior via configuration
- Document-level tenant isolation enforced at both security rules and application layers
- Event-driven: Firestore triggers and webhooks drive all asynchronous processing
- Secrets never touch the client -- all third-party API calls happen in Cloud Functions

### System Component Diagram

```
+------------------------------------------------------------------+
|                        CLIENT LAYER                               |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |  React SPA (TypeScript + Tailwind CSS)                     |  |
|  |  Firebase Hosting: agentflowai-11dd2.web.app               |  |
|  |                                                             |  |
|  |  Pages: Dashboard | Leads | Conversations | Calendar |     |  |
|  |         Billing | Settings | Analytics | Compliance         |  |
|  |                                                             |  |
|  |  State: React Context + Firestore onSnapshot (real-time)   |  |
|  |  Auth:  Firebase Auth SDK (email/password, Google OAuth)    |  |
|  +------------------------------------------------------------+  |
+------------------------------|------------------------------------+
                               | HTTPS / WSS (Firestore real-time)
                               v
+------------------------------------------------------------------+
|                      FIREBASE PLATFORM                            |
|                                                                   |
|  +------------------+  +------------------+  +-----------------+  |
|  | Firebase Auth    |  | Firestore DB     |  | Firebase        |  |
|  | - Email/Password |  | - tenants        |  | Hosting         |  |
|  | - Google OAuth   |  | - leads          |  | - React SPA     |  |
|  | - Custom Claims  |  | - messages (sub) |  | - CDN delivery  |  |
|  |   (role, tenant) |  | - appointments   |  |                 |  |
|  +------------------+  | - market_config  |  +-----------------+  |
|                        | - usage_logs     |                       |
|                        | - compliance_log |                       |
|                        +------------------+                       |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |              CLOUD FUNCTIONS (Node.js / TypeScript)         |  |
|  |                                                             |  |
|  |  HTTP Triggers:              Firestore Triggers:            |  |
|  |  - whatsappWebhook           - onLeadCreated                |  |
|  |  - paystackWebhook           - onTenantCreated              |  |
|  |  - stripeWebhook                                            |  |
|  |  - calendarManager           Scheduled:                     |  |
|  |  - leadIngestion             - dailyBatchJobs               |  |
|  |                                                             |  |
|  |  Callable:                                                  |  |
|  |  - provisionTenant                                          |  |
|  |  - aiConversationOrchestrator                               |  |
|  |  - complianceLogger                                         |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------+                                             |
|  | Cloud Secret     |                                             |
|  | Manager          |                                             |
|  | - CLAUDE_API_KEY |                                             |
|  | - WHATSAPP_TOKEN |                                             |
|  | - WHATSAPP_SECRET|                                             |
|  | - PAYSTACK_SECRET|                                             |
|  | - STRIPE_SECRET  |                                             |
|  | - STRIPE_WEBHOOK |                                             |
|  | - GOOGLE_CLIENT  |                                             |
|  | - GOOGLE_SECRET  |                                             |
|  | - MS_CLIENT_ID   |                                             |
|  | - MS_CLIENT_SEC  |                                             |
|  +------------------+                                             |
+------------------------------------------------------------------+
                               |
              +----------------+------------------+
              |                |                  |
              v                v                  v
+----------------+  +------------------+  +------------------+
| EXTERNAL APIs  |  | PAYMENT          |  | CALENDAR         |
|                |  | PROVIDERS        |  | PROVIDERS        |
| WhatsApp Bus.  |  |                  |  |                  |
| API (Meta)     |  | Paystack (NG)    |  | Google Calendar  |
|                |  | Stripe (Dubai)   |  | API v3           |
| Claude API     |  |                  |  |                  |
| (Anthropic)    |  |                  |  | Microsoft Graph  |
+----------------+  +------------------+  | (Outlook)        |
                                          +------------------+
```

### Request Flow Overview

```
Lead (WhatsApp)                Agent (Browser)
      |                              |
      v                              v
Meta Cloud API              Firebase Hosting (SPA)
      |                              |
      v                              v
whatsappWebhook CF          Firestore (direct read/write
      |                     via security rules)
      v                              |
Firestore write  <-------------------+
(lead + message)
      |
      v (onCreate trigger)
aiConversationOrchestrator CF
      |
      +---> Claude API (generate response)
      |
      +---> Compliance check (market-specific)
      |
      +---> WhatsApp API (send reply)
      |
      +---> Firestore write (outbound message, lead score update)
```

---

## 2. Firestore Collection Schemas

### Collection: `/market_config/{marketId}`

Seeded at project initialization. Read-only for tenants.

```typescript
// Document IDs: "nigeria", "dubai"
interface MarketConfig {
  marketId: "nigeria" | "dubai";
  displayName: string;                    // "Nigeria" | "Dubai"
  region: "africa-west" | "mena";
  currency: {
    code: "NGN" | "AED";
    symbol: "₦" | "AED";
    locale: "en-NG" | "en-AE";
  };
  timezone: "Africa/Lagos" | "Asia/Dubai";
  weekend: string[];                      // ["sat","sun"] | ["fri","sat"]
  dateFormat: "DD/MM/YYYY";
  compliance: {
    framework: "NDPR" | "RERA";
    consentRequired: boolean;             // true for Nigeria
    auditRetentionYears: number;          // 5 for Dubai, 1 for Nigeria
    blockedPhrases: string[];             // RERA: ["guaranteed returns", ...]
  };
  ai: {
    defaultPersona: "Chioma" | "Aisha";
    systemPromptTemplate: string;         // Market-specific Claude system prompt
    qualificationQuestions: string[];
    escalationTriggers: string[];
  };
  whatsapp: {
    utilityRate: number;                  // 0.0067 (NG) | 0.0107 (AE) USD
    marketingRate: number;                // 0.0516 (NG) | 0.0455 (AE) USD
  };
  subscriptionTiers: {
    solo: { price: number; leadsPerMonth: number; maxAgents: number; };
    team: { price: number; leadsPerMonth: number; maxAgents: number; };
    brokerage: { price: number; leadsPerMonth: number; maxAgents: number; };
  };
  phonePrefix: "+234" | "+971";
  areas: string[];                        // ["Lekki","Ikoyi",...] | ["Dubai Marina",...]
  propertyTypes: string[];
  culturalBlocks: {                       // Times to never suggest appointments
    enabled: boolean;
    blocks: Array<{ day: string; start: string; end: string; reason: string; }>;
    // Dubai: [{ day: "friday", start: "12:00", end: "14:00", reason: "Jumu'ah prayer" }]
  };
}
```

### Collection: `/tenants/{tenantId}`

One document per tenant. `tenantId` equals the Firebase Auth UID of the admin user.

```typescript
interface Tenant {
  tenantId: string;                       // Same as Firebase Auth UID
  market: "nigeria" | "dubai";
  region: "africa-west" | "mena";
  status: "trial" | "active" | "suspended" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;

  agent: {
    name: string;
    email: string;
    phone: string;                        // E.164 format: +234... or +971...
    licenseNumber: string;                // RERA license or State license
    brokerage: string;
    preferredLanguage: "en" | "en-ng" | "en-ae" | "ar";
  };

  config: {
    currency: { code: string; symbol: string; locale: string; };
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
    personaName: string;                  // "Chioma" | "Aisha" | custom
    greetingScript: string;
    handoffThreshold: number;             // Score 0-100, default 60
    qualificationQuestions: string[];
    languages: string[];
    features: {
      offPlanSupport: boolean;            // Dubai: true
      rentalYieldCalc: boolean;           // Dubai: true
      mobileMoney: boolean;              // Nigeria: true
      ejariIntegration: boolean;          // Dubai: true
    };
    approvalMode: boolean;                // FR29: require agent approval before sending
  };

  integrations: {
    whatsapp: {
      enabled: boolean;
      phoneNumberId: string;
      wabaId: string;
      connectedAt: Timestamp;
    };
    calendar: {
      google: {
        enabled: boolean;
        refreshToken: string;             // Encrypted
        email: string;
        connectedAt: Timestamp;
      };
      outlook: {
        enabled: boolean;
        refreshToken: string;             // Encrypted
        email: string;
        connectedAt: Timestamp;
      };
      preferred: "google" | "outlook";
    };
    payments: {
      provider: "paystack" | "stripe";
      customerId: string;                 // Paystack customer code or Stripe customer ID
      subscriptionId: string;
      tier: "solo" | "team" | "brokerage";
      currentPeriodEnd: Timestamp;
    };
    crm: {
      webhooks: Record<string, {          // key: source name
        enabled: boolean;
        apiKey: string;                   // Tenant-specific webhook auth key
        url: string;
      }>;
    };
  };

  usage: {
    leadsThisMonth: number;
    whatsappConversations: number;
    aiTokensConsumed: number;
    appointmentsBooked: number;
    lastResetAt: Timestamp;               // Monthly reset timestamp
  };

  team: {
    agents: Record<string, {              // key: agent UID
      name: string;
      email: string;
      role: "admin" | "agent";
      status: "active" | "invited" | "disabled";
      addedAt: Timestamp;
    }>;
  };
}
```

### Collection: `/tenants/{tenantId}/leads/{leadId}`

Leads stored as a subcollection under the tenant for natural security rule scoping.

```typescript
interface Lead {
  leadId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  source: "whatsapp" | "manual" | "property_finder" | "bayut"
        | "nigerian_property_centre" | "referral" | "other";
  status: "new" | "contacted" | "qualified" | "appointment_set"
        | "closed" | "dead";
  createdAt: Timestamp;
  updatedAt: Timestamp;

  contact: {
    name: string;
    phone: string;                        // E.164 format
    email?: string;
    preferredLanguage: string;
    whatsappProfileName?: string;
  };

  propertyInterest: {
    // Universal fields
    budgetMin: number;
    budgetMax: number;
    currency: "NGN" | "AED";
    timeline: string;                     // "immediate" | "1-3months" | "3-6months" | "6months+"
    propertyType: string;                 // "apartment" | "villa" | "land" | "commercial" | "office"
    desiredAreas: string[];
    // Market-specific extensions
    dubaiSpecific?: {
      offPlan: boolean;
      handoverDate?: string;
      freehold: boolean;
      investmentType: "primary_residence" | "investment" | "holiday_home";
      targetYield?: number;
      islamicFinance: boolean;
    };
    nigeriaSpecific?: {
      landSize?: string;                  // In plots or acres
      titleType: "c_of_o" | "governors_consent" | "deed" | "survey_plan";
      infrastructureNeeds: string[];      // ["road","water","electricity","security"]
      paymentPlan: "outright" | "installment" | "mortgage";
    };
  };

  qualification: {
    score: number;                        // 0-100
    status: "unqualified" | "qualifying" | "qualified" | "disqualified";
    urgency: "hot" | "warm" | "cold";
    readiness: {
      budgetConfirmed: boolean;
      timelineConfirmed: boolean;
      propertyTypeConfirmed: boolean;
      areaConfirmed: boolean;
      agentReady: boolean;                // true when ready for human handoff
    };
    escalation?: {
      triggered: boolean;
      reason: string;
      reasonCode: string;
      timestamp: Timestamp;
    };
    summary?: string;                     // AI-generated qualification summary
  };

  conversation: {
    threadId: string;                     // Claude conversation thread reference
    channel: "whatsapp" | "manual";
    lastMessageAt: Timestamp;
    messageCount: number;
    aiActive: boolean;                    // false when agent takes over
    languageDetected?: string;
    windowExpiresAt?: Timestamp;          // WhatsApp 24-hour window expiry
  };

  appointment?: {
    appointmentId: string;
    scheduledAt: Timestamp;
    status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  };

  consent?: {                             // NDPR (Nigeria)
    given: boolean;
    timestamp: Timestamp;
    method: "whatsapp_reply";
    text: string;
  };

  notes?: string;                         // Agent notes
}
```

### Subcollection: `/tenants/{tenantId}/leads/{leadId}/messages/{messageId}`

Every message in a lead conversation, append-only for audit compliance.

```typescript
interface Message {
  messageId: string;
  tenantId: string;
  leadId: string;
  type: "inbound" | "outbound" | "system";
  channel: "whatsapp" | "dashboard" | "system";
  senderType: "lead" | "ai" | "agent" | "system";

  content: {
    text?: string;
    audioUrl?: string;                    // Voice message
    mediaUrl?: string;                    // Image/document
    mediaType?: "image" | "document" | "video" | "audio";
    templateName?: string;                // If sent as template message
    location?: { latitude: number; longitude: number; };
  };

  metadata: {
    aiGenerated: boolean;
    aiModel?: string;                     // "claude-sonnet-4-20250514"
    tokensUsed?: number;
    languageDetected?: string;
    languageConfidence?: number;
    complianceCheck?: "passed" | "flagged" | "blocked";
    complianceNotes?: string;
    entities?: {                          // AI-extracted entities
      budget?: string;
      timeline?: string;
      propertyType?: string;
      areas?: string[];
      requirements?: string[];
    };
    whatsappMessageId?: string;           // Meta message ID for delivery tracking
    deliveryStatus?: "sent" | "delivered" | "read" | "failed";
  };

  timestamp: Timestamp;
  createdAt: Timestamp;
}
```

### Collection: `/tenants/{tenantId}/appointments/{appointmentId}`

```typescript
interface Appointment {
  appointmentId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  leadId: string;
  agentId?: string;                       // For multi-agent tenants

  scheduledAt: Timestamp;
  duration: number;                       // Minutes, default 60
  timezone: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  type: "property_viewing" | "buyer_consultation" | "valuation"
      | "video_call" | "other";

  location?: {
    address: string;
    coordinates?: { latitude: number; longitude: number; };
  };

  calendarEventId?: string;              // Google/Outlook event ID
  calendarProvider?: "google" | "outlook";
  remindersSent: {
    twentyFourHour: boolean;
    oneHour: boolean;
  };

  notes?: string;                         // AI-generated context for the agent
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `/usage_logs/{logId}`

Append-only log for billing and analytics.

```typescript
interface UsageLog {
  logId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  date: string;                           // "2026-04-07" (ISO date for aggregation)
  type: "whatsapp_utility" | "whatsapp_marketing" | "ai_tokens"
      | "lead_created" | "appointment_booked";
  quantity: number;
  unitCost: number;                       // USD
  totalCost: number;                      // USD
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}
```

### Collection: `/compliance_log/{logId}`

Append-only compliance audit trail.

```typescript
interface ComplianceLog {
  logId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  leadId?: string;
  messageId?: string;
  eventType: "consent_captured" | "consent_declined" | "deletion_requested"
           | "deletion_completed" | "rera_check_passed" | "rera_check_flagged"
           | "rera_check_blocked" | "fraud_detected" | "escalation_triggered"
           | "violation_logged";
  severity: "info" | "warning" | "critical";
  details: {
    violationType?: "rera_roi_guarantee" | "rera_nationality_steering"
                  | "ndpr_consent_missing" | "fraud_indicator";
    description: string;
    resolution?: string;
    resolvedAt?: Timestamp;
  };
  timestamp: Timestamp;
}
```

### Subcollection: `/phone_mappings/{phoneNumberId}`

Top-level collection for webhook routing: maps WhatsApp phone number IDs to tenant IDs.

```typescript
interface PhoneMapping {
  phoneNumberId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  createdAt: Timestamp;
}
```

### Firestore Indexes

```
// Composite indexes required for common query patterns

// Leads by tenant + status + urgency
Collection: tenants/{tenantId}/leads
Fields: status ASC, urgency ASC, updatedAt DESC

// Leads by tenant + source
Collection: tenants/{tenantId}/leads
Fields: source ASC, createdAt DESC

// Leads by tenant + score (for qualification pipeline)
Collection: tenants/{tenantId}/leads
Fields: qualification.score DESC, updatedAt DESC

// Messages by timestamp (conversation view)
Collection: tenants/{tenantId}/leads/{leadId}/messages
Fields: timestamp ASC

// Appointments by tenant + date range
Collection: tenants/{tenantId}/appointments
Fields: scheduledAt ASC, status ASC

// Usage logs by tenant + date
Collection: usage_logs
Fields: tenantId ASC, date DESC, type ASC

// Compliance logs by tenant + date
Collection: compliance_log
Fields: tenantId ASC, timestamp DESC, severity ASC
```

---

## 3. Cloud Functions Specification

All Cloud Functions are written in Node.js/TypeScript, deployed from `/functions/src/`. Each function reads `tenant.market` at runtime to resolve market-specific behavior.

### Function 1: `provisionTenant`

**Type:** Callable (`functions.https.onCall`)
**Trigger:** Called from React frontend during signup
**Purpose:** Creates a new tenant document with market-specific defaults after Firebase Auth account creation.

```typescript
// functions/src/tenant/provisionTenant.ts
export const provisionTenant = functions.https.onCall(async (data, context) => {
  // Input
  const { market } = data as { market: "nigeria" | "dubai" };

  // Auth check
  if (!context.auth) throw new HttpsError("unauthenticated", "Login required");
  const uid = context.auth.uid;

  // Load market defaults
  const marketConfig = await db.doc(`market_config/${market}`).get();

  // Create tenant document
  await db.doc(`tenants/${uid}`).set({
    tenantId: uid,
    market,
    region: marketConfig.data().region,
    status: "trial",
    config: {
      currency: marketConfig.data().currency,
      timezone: marketConfig.data().timezone,
      weekend: marketConfig.data().weekend,
      dateFormat: marketConfig.data().dateFormat,
      compliance: marketConfig.data().compliance,
    },
    aiConfig: {
      personaName: marketConfig.data().ai.defaultPersona,
      greetingScript: "",
      handoffThreshold: 60,
      qualificationQuestions: marketConfig.data().ai.qualificationQuestions,
      languages: ["en"],
      features: market === "dubai"
        ? { offPlanSupport: true, rentalYieldCalc: true, mobileMoney: false, ejariIntegration: true }
        : { offPlanSupport: false, rentalYieldCalc: false, mobileMoney: true, ejariIntegration: false },
      approvalMode: false,
    },
    integrations: { whatsapp: { enabled: false }, calendar: {}, payments: {}, crm: {} },
    usage: { leadsThisMonth: 0, whatsappConversations: 0, aiTokensConsumed: 0, appointmentsBooked: 0, lastResetAt: Timestamp.now() },
    team: { agents: {} },
    agent: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Set custom claims for security rules
  await admin.auth().setCustomUserClaims(uid, { tenantId: uid, role: "admin", market });

  return { success: true, tenantId: uid };
});
```

**Error Handling:** Returns `already-exists` if tenant document exists, `invalid-argument` if market is invalid.

### Function 2: `leadIngestion`

**Type:** HTTP Trigger (`functions.https.onRequest`)
**Trigger:** POST from external webhooks (Property Finder, Bayut, Nigerian Property Centre)
**Purpose:** Ingests leads from external property portals, normalizes to universal schema, triggers AI qualification.

```typescript
// functions/src/leads/leadIngestion.ts
export const leadIngestion = functions.https.onRequest(async (req, res) => {
  // Route: POST /leadIngestion?source={source}&key={tenant_api_key}
  const { source, key } = req.query;

  // Validate API key -> resolve tenantId
  const tenantSnap = await db.collection("tenants")
    .where(`integrations.crm.webhooks.${source}.apiKey`, "==", key)
    .limit(1).get();

  if (tenantSnap.empty) { res.status(401).send("Invalid API key"); return; }
  const tenant = tenantSnap.docs[0].data();

  // Normalize payload based on source
  const normalizedLead = normalizeLeadPayload(source, req.body, tenant.market);

  // Duplicate detection by phone number
  const existing = await db.collection(`tenants/${tenant.tenantId}/leads`)
    .where("contact.phone", "==", normalizedLead.contact.phone)
    .limit(1).get();

  if (!existing.empty) {
    // Append new inquiry to existing lead
    await appendInquiry(existing.docs[0].id, normalizedLead, tenant.tenantId);
    res.status(200).json({ status: "appended", leadId: existing.docs[0].id });
    return;
  }

  // Check tier limits
  if (await isLeadLimitReached(tenant)) {
    res.status(429).json({ error: "Lead limit reached for current tier" });
    return;
  }

  // Create new lead
  const leadRef = db.collection(`tenants/${tenant.tenantId}/leads`).doc();
  await leadRef.set({ ...normalizedLead, leadId: leadRef.id, tenantId: tenant.tenantId });

  // Increment usage counter
  await db.doc(`tenants/${tenant.tenantId}`).update({
    "usage.leadsThisMonth": FieldValue.increment(1),
  });

  res.status(201).json({ status: "created", leadId: leadRef.id });
});
```

### Function 3: `aiConversationOrchestrator`

**Type:** Callable (`functions.https.onCall`) + internal invocation from `whatsappWebhook`
**Trigger:** Called when a new lead message arrives or a new lead is created
**Purpose:** Manages the AI conversation lifecycle -- builds context, calls Claude API, applies compliance checks, sends reply via WhatsApp.

```typescript
// functions/src/ai/aiConversationOrchestrator.ts
export const aiConversationOrchestrator = functions.https.onCall(async (data, context) => {
  const { tenantId, leadId, inboundMessage } = data;

  // 1. Load tenant config and market config
  const tenant = await loadTenant(tenantId);
  const marketConfig = await loadMarketConfig(tenant.market);

  // 2. Load lead and conversation history
  const lead = await loadLead(tenantId, leadId);
  const messages = await loadMessages(tenantId, leadId, { limit: 50 });

  // 3. Check if AI is active for this lead
  if (!lead.conversation.aiActive) return { status: "ai_paused" };

  // 4. Check if approval mode is on (queue instead of send)
  const approvalMode = tenant.aiConfig.approvalMode;

  // 5. Build Claude system prompt (market-specific)
  const systemPrompt = buildSystemPrompt(tenant, marketConfig, lead);

  // 6. Build message history for Claude context
  const claudeMessages = buildClaudeMessages(messages, inboundMessage);

  // 7. Call Claude API
  const claudeApiKey = await getSecret("CLAUDE_API_KEY");
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const aiReplyText = response.content[0].text;
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  // 8. Extract entities and update lead qualification
  const extraction = await extractEntities(response, lead, tenant.market);
  await updateLeadQualification(tenantId, leadId, extraction);

  // 9. Compliance check (market-specific)
  const complianceResult = await runComplianceCheck(aiReplyText, tenant.market, marketConfig);

  let finalMessage = aiReplyText;
  if (complianceResult.status === "blocked") {
    // Rewrite message with compliance constraints
    finalMessage = await rewriteWithCompliance(aiReplyText, complianceResult, systemPrompt, claudeMessages);
  }

  // 10. If approval mode, store as pending; otherwise send via WhatsApp
  if (approvalMode) {
    await storePendingMessage(tenantId, leadId, finalMessage, tokensUsed, complianceResult);
    return { status: "pending_approval" };
  }

  // 11. Send via WhatsApp
  await sendWhatsAppMessage(tenant, lead.contact.phone, finalMessage);

  // 12. Store outbound message
  await storeMessage(tenantId, leadId, {
    type: "outbound",
    channel: "whatsapp",
    senderType: "ai",
    content: { text: finalMessage },
    metadata: {
      aiGenerated: true,
      aiModel: "claude-sonnet-4-20250514",
      tokensUsed,
      complianceCheck: complianceResult.status,
      entities: extraction.entities,
    },
  });

  // 13. Log usage
  await logUsage(tenantId, tenant.market, "ai_tokens", tokensUsed);

  // 14. Log compliance event if flagged
  if (complianceResult.status !== "passed") {
    await logCompliance(tenantId, leadId, complianceResult);
  }

  return { status: "sent", tokensUsed };
});
```

**System Prompt Builder:**

```typescript
function buildSystemPrompt(tenant: Tenant, marketConfig: MarketConfig, lead: Lead): string {
  const persona = tenant.aiConfig.personaName;
  const agentName = tenant.agent.name;
  const market = tenant.market;

  let prompt = `You are ${persona}, an AI real estate assistant working for ${agentName}`;
  if (tenant.agent.brokerage) prompt += ` at ${tenant.agent.brokerage}`;
  prompt += `. License: ${tenant.agent.licenseNumber}.\n\n`;

  if (market === "nigeria") {
    prompt += `MARKET CONTEXT: Nigeria real estate. Currency: NGN (₦). Areas: Lagos (Lekki, Ikoyi, Victoria Island, Ajah), Abuja (Maitama, Asokoro, Gwarinpa).
CULTURAL: You understand Nigerian Pidgin English. You know Lagos traffic patterns. You reference infrastructure (road, water, light, security) because it matters. You understand C of O, Governor's Consent, Deed, Survey Plan title types.
PAYMENT: Outright, installment plans, and mortgage are common. Agents often accept payment plans.
COMPLIANCE (NDPR): Always request data processing consent before collecting personal information. Never share property details that could enable fraud.
ESCALATION: Flag "distress sale" language, upfront commission requests, requests for personal bank details, significantly below-market pricing.`;
  } else if (market === "dubai") {
    prompt += `MARKET CONTEXT: Dubai real estate. Currency: AED. Areas: Dubai Marina, Downtown, Palm Jumeirah, JVC, JBR, Arabian Ranches, Business Bay.
CULTURAL: Dubai is multicultural -- buyers include Indian, British, Russian, Chinese, Pakistani nationals. Respect prayer times (Friday 12-2 PM). Understand Ramadan sensitivities. Use professional, international English.
PROPERTY: Understand off-plan vs ready, freehold zones, payment plans (50/50, post-handover, construction-linked). Know rental yield ranges (5-8% typical).
COMPLIANCE (RERA): NEVER guarantee returns or specific ROI. Use hedging language ("historically," "typically"). NEVER steer based on nationality. Always include agent's RERA license.
ESCALATION: Flag guaranteed ROI demands, attempts to bypass documentation, suspicious payment routing.`;
  }

  prompt += `\n\nQUALIFICATION GOAL: Through natural conversation, determine: budget range, timeline, property type, desired areas, payment preference, and any market-specific criteria. Score the lead 0-100. When score >= ${tenant.aiConfig.handoffThreshold}, suggest an appointment.`;

  if (tenant.aiConfig.greetingScript) {
    prompt += `\n\nCUSTOM GREETING: ${tenant.aiConfig.greetingScript}`;
  }

  return prompt;
}
```

### Function 4: `whatsappWebhook`

**Type:** HTTP Trigger (`functions.https.onRequest`)
**Trigger:** POST from Meta WhatsApp Business API
**Purpose:** Receives inbound WhatsApp messages, verifies signature, routes to correct tenant, creates/updates lead, triggers AI.

```typescript
// functions/src/whatsapp/whatsappWebhook.ts
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // GET: Webhook verification (Meta challenge)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = await getSecret("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
    return;
  }

  // POST: Inbound message
  // 1. Verify X-Hub-Signature-256
  const appSecret = await getSecret("WHATSAPP_APP_SECRET");
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!verifyWebhookSignature(req.rawBody, signature, appSecret)) {
    res.status(403).send("Invalid signature");
    return;
  }

  // 2. Parse webhook payload
  const entries = req.body.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id;

      // 3. Resolve tenant from phoneNumberId
      const mappingSnap = await db.doc(`phone_mappings/${phoneNumberId}`).get();
      if (!mappingSnap.exists) continue;
      const { tenantId, market } = mappingSnap.data();

      // 4. Process each message
      for (const message of value.messages || []) {
        const senderPhone = message.from;  // E.164 format
        const contactName = value.contacts?.[0]?.profile?.name || "";

        // 5. Parse message content by type
        const content = parseMessageContent(message);
        // Handles: text, audio (voice), image, document, video, location

        // 6. Voice message transcription
        if (message.type === "audio") {
          content.text = await transcribeVoiceMessage(message.audio.id, phoneNumberId);
        }

        // 7. Find or create lead
        const leadId = await findOrCreateLead(tenantId, market, senderPhone, contactName);

        // 8. Store inbound message
        await storeMessage(tenantId, leadId, {
          type: "inbound",
          channel: "whatsapp",
          senderType: "lead",
          content,
          metadata: {
            aiGenerated: false,
            whatsappMessageId: message.id,
            languageDetected: null, // Will be set by AI
          },
        });

        // 9. Update conversation window
        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
          "conversation.lastMessageAt": FieldValue.serverTimestamp(),
          "conversation.windowExpiresAt": Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
          "conversation.messageCount": FieldValue.increment(1),
        });

        // 10. Log WhatsApp usage (inbound = free, but track for analytics)
        await logUsage(tenantId, market, "whatsapp_utility", 1);

        // 11. Trigger AI conversation (if AI is active for this lead)
        await triggerAIConversation(tenantId, leadId, content.text);
      }

      // Process delivery status updates
      for (const status of value.statuses || []) {
        await updateDeliveryStatus(status);
      }
    }
  }

  // Always respond 200 quickly (Meta requirement)
  res.status(200).send("OK");
});
```

### Function 5: `calendarManager`

**Type:** Callable (`functions.https.onCall`)
**Trigger:** Called from AI orchestrator (appointment suggestion) and dashboard (manual booking)
**Purpose:** Checks calendar availability, creates/updates/cancels events, sends WhatsApp confirmations.

```typescript
// functions/src/calendar/calendarManager.ts
export const calendarManager = functions.https.onCall(async (data, context) => {
  const { action, tenantId, leadId, appointmentData } = data;
  // action: "checkAvailability" | "createAppointment" | "reschedule" | "cancel"

  const tenant = await loadTenant(tenantId);
  const marketConfig = await loadMarketConfig(tenant.market);

  switch (action) {
    case "checkAvailability": {
      const { dateRange } = appointmentData;
      const slots: AvailableSlot[] = [];

      // Check Google Calendar
      if (tenant.integrations.calendar.google?.enabled) {
        const googleSlots = await getGoogleAvailability(
          tenant.integrations.calendar.google.refreshToken,
          dateRange
        );
        slots.push(...googleSlots);
      }

      // Check Outlook Calendar
      if (tenant.integrations.calendar.outlook?.enabled) {
        const outlookSlots = await getOutlookAvailability(
          tenant.integrations.calendar.outlook.refreshToken,
          dateRange
        );
        slots.push(...outlookSlots);
      }

      // Filter out cultural blocks
      const filtered = applyCulturalBlocks(slots, marketConfig.culturalBlocks, marketConfig.weekend);

      return { availableSlots: filtered };
    }

    case "createAppointment": {
      const { scheduledAt, duration, type, location, notes } = appointmentData;
      const lead = await loadLead(tenantId, leadId);

      // Create calendar event on preferred provider
      const provider = tenant.integrations.calendar.preferred || "google";
      const eventId = await createCalendarEvent(tenant, provider, {
        title: `[AgentFlow] Viewing - ${lead.contact.name}`,
        description: buildEventDescription(lead),
        start: scheduledAt,
        duration: duration || 60,
        location: location?.address,
      });

      // Create Firestore appointment
      const apptRef = db.collection(`tenants/${tenantId}/appointments`).doc();
      await apptRef.set({
        appointmentId: apptRef.id,
        tenantId,
        market: tenant.market,
        leadId,
        scheduledAt,
        duration: duration || 60,
        timezone: tenant.config.timezone,
        status: "scheduled",
        type: type || "property_viewing",
        location,
        calendarEventId: eventId,
        calendarProvider: provider,
        remindersSent: { twentyFourHour: false, oneHour: false },
        notes,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update lead
      await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
        "appointment.appointmentId": apptRef.id,
        "appointment.scheduledAt": scheduledAt,
        "appointment.status": "scheduled",
        status: "appointment_set",
      });

      // Send WhatsApp confirmation
      await sendAppointmentConfirmation(tenant, lead, scheduledAt, location);

      // Log usage
      await db.doc(`tenants/${tenantId}`).update({
        "usage.appointmentsBooked": FieldValue.increment(1),
      });

      return { appointmentId: apptRef.id, calendarEventId: eventId };
    }

    case "reschedule": {
      // Update calendar event, appointment doc, send WhatsApp notification
      // ...implementation
      break;
    }

    case "cancel": {
      // Delete calendar event, update appointment status, send WhatsApp notification
      // ...implementation
      break;
    }
  }
});
```

### Function 6: `paymentProcessor`

**Type:** HTTP Trigger (`functions.https.onRequest`)
**Endpoints:** `/webhook/paystack`, `/webhook/stripe`
**Purpose:** Handles payment initialization and webhook processing for both Paystack (Nigeria) and Stripe (Dubai).

```typescript
// functions/src/payments/paymentProcessor.ts

// --- Paystack Webhook ---
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify Paystack signature
  const paystackSecret = await getSecret("PAYSTACK_SECRET_KEY");
  const hash = crypto.createHmac("sha512", paystackSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash !== req.headers["x-paystack-signature"]) {
    res.status(401).send("Invalid signature");
    return;
  }

  // 2. Idempotency check
  const eventId = req.body.data?.reference;
  const processed = await checkIdempotency("paystack", eventId);
  if (processed) { res.status(200).send("Already processed"); return; }

  // 3. Handle event types
  const event = req.body.event;
  const data = req.body.data;

  switch (event) {
    case "charge.success": {
      const tenantId = data.metadata?.tenantId;
      const tier = data.metadata?.tier;
      await activateSubscription(tenantId, "paystack", tier, data);
      await sendPaymentReceipt(tenantId, data.amount / 100, "NGN", tier);
      break;
    }
    case "subscription.create":
    case "invoice.payment_failed": {
      const tenantId = data.metadata?.tenantId;
      await handleFailedPayment(tenantId, data);
      break;
    }
  }

  await markIdempotent("paystack", eventId);
  res.status(200).send("OK");
});

// --- Stripe Webhook ---
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify Stripe signature
  const stripeWebhookSecret = await getSecret("STRIPE_WEBHOOK_SECRET");
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers["stripe-signature"], stripeWebhookSecret);
  } catch (err) {
    res.status(400).send("Invalid signature");
    return;
  }

  // 2. Idempotency check
  const processed = await checkIdempotency("stripe", event.id);
  if (processed) { res.status(200).send("Already processed"); return; }

  // 3. Handle event types
  switch (event.type) {
    case "payment_intent.succeeded":
    case "invoice.paid": {
      const tenantId = event.data.object.metadata?.tenantId;
      const tier = event.data.object.metadata?.tier;
      await activateSubscription(tenantId, "stripe", tier, event.data.object);
      await sendPaymentReceipt(tenantId, event.data.object.amount / 100, "AED", tier);
      break;
    }
    case "invoice.payment_failed": {
      const tenantId = event.data.object.metadata?.tenantId;
      await handleFailedPayment(tenantId, event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      const tenantId = event.data.object.metadata?.tenantId;
      await cancelSubscription(tenantId);
      break;
    }
  }

  await markIdempotent("stripe", event.id);
  res.status(200).send("OK");
});

// --- Payment Initialization (Callable) ---
export const initializePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError("unauthenticated", "Login required");
  const { tier } = data;
  const tenant = await loadTenant(context.auth.uid);

  if (tenant.market === "nigeria") {
    const paystackSecret = await getSecret("PAYSTACK_SECRET_KEY");
    // Initialize Paystack transaction
    const response = await axios.post("https://api.paystack.co/transaction/initialize", {
      email: tenant.agent.email,
      amount: getPaystackAmount(tier),    // Amount in kobo
      currency: "NGN",
      channels: ["card", "bank", "ussd", "qr", "mobile_money"],
      metadata: { tenantId: tenant.tenantId, tier },
      callback_url: `https://agentflowai-11dd2.web.app/billing/callback`,
    }, { headers: { Authorization: `Bearer ${paystackSecret}` } });

    return { authorizationUrl: response.data.data.authorization_url, reference: response.data.data.reference };
  }

  if (tenant.market === "dubai") {
    const stripeSecret = await getSecret("STRIPE_SECRET_KEY");
    const stripeClient = new Stripe(stripeSecret);
    // Create Stripe Checkout Session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: getStripePriceId(tier), quantity: 1 }],
      metadata: { tenantId: tenant.tenantId, tier },
      success_url: `https://agentflowai-11dd2.web.app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://agentflowai-11dd2.web.app/billing/cancel`,
    });

    return { sessionId: session.id, url: session.url };
  }
});
```

### Function 7: `complianceLogger`

**Type:** Callable (`functions.https.onCall`) + internal utility
**Trigger:** Called from AI orchestrator, webhook handlers, and scheduled jobs
**Purpose:** Centralized compliance event logging, audit trail management, consent handling, and report generation.

```typescript
// functions/src/compliance/complianceLogger.ts
export const complianceLogger = functions.https.onCall(async (data, context) => {
  const { action, tenantId, leadId, eventData } = data;

  switch (action) {
    case "logEvent": {
      const { eventType, severity, details, messageId } = eventData;
      const logRef = db.collection("compliance_log").doc();
      const tenant = await loadTenant(tenantId);
      await logRef.set({
        logId: logRef.id,
        tenantId,
        market: tenant.market,
        leadId: leadId || null,
        messageId: messageId || null,
        eventType,
        severity,
        details,
        timestamp: FieldValue.serverTimestamp(),
      });

      // Critical events trigger immediate agent notification
      if (severity === "critical") {
        await sendAgentNotification(tenantId, `Compliance alert: ${details.description}`);
      }
      return { logId: logRef.id };
    }

    case "captureConsent": {
      const { consentGiven, consentText } = eventData;
      await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
        "consent.given": consentGiven,
        "consent.timestamp": FieldValue.serverTimestamp(),
        "consent.method": "whatsapp_reply",
        "consent.text": consentText,
      });
      await logComplianceEvent(tenantId, leadId, consentGiven ? "consent_captured" : "consent_declined", "info", {
        description: consentGiven ? "Lead consented to data processing" : "Lead declined data processing",
      });
      return { success: true };
    }

    case "requestDeletion": {
      // NDPR right to deletion -- schedule deletion within 30 days
      await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
        "status": "dead",
        "notes": "NDPR deletion requested",
      });
      await logComplianceEvent(tenantId, leadId, "deletion_requested", "info", {
        description: `Deletion requested. Deadline: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`,
      });
      return { success: true, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
    }

    case "executeDeletion": {
      // Purge all lead data
      await deleteLeadData(tenantId, leadId);
      await logComplianceEvent(tenantId, null, "deletion_completed", "info", {
        description: `Lead ${leadId} deleted per NDPR request. No PII retained.`,
      });
      return { success: true };
    }

    case "generateReport": {
      const { startDate, endDate } = eventData;
      const logs = await db.collection("compliance_log")
        .where("tenantId", "==", tenantId)
        .where("timestamp", ">=", Timestamp.fromDate(new Date(startDate)))
        .where("timestamp", "<=", Timestamp.fromDate(new Date(endDate)))
        .orderBy("timestamp", "desc")
        .get();

      return {
        totalEvents: logs.size,
        events: logs.docs.map(d => d.data()),
        summary: generateComplianceSummary(logs.docs.map(d => d.data())),
      };
    }
  }
});
```

### Function 8: `dailyBatchJobs`

**Type:** Scheduled (`functions.pubsub.schedule`)
**Schedule:** `every day 02:00` (tenant timezone-aware for reminders)
**Purpose:** Runs recurring maintenance: appointment reminders, usage counter resets, dunning retries, stale lead cleanup, compliance report scheduling.

```typescript
// functions/src/scheduled/dailyBatchJobs.ts
export const dailyBatchJobs = functions.pubsub
  .schedule("every day 02:00")
  .timeZone("UTC")
  .onRun(async () => {
    // 1. APPOINTMENT REMINDERS
    // Find appointments in next 25 hours that haven't had 24hr reminder
    const tomorrow = Timestamp.fromMillis(Date.now() + 25 * 60 * 60 * 1000);
    const now = Timestamp.now();

    const allTenants = await db.collection("tenants")
      .where("status", "in", ["active", "trial"])
      .get();

    for (const tenantDoc of allTenants.docs) {
      const tenantId = tenantDoc.id;

      // 24-hour reminders
      const upcomingAppts = await db.collection(`tenants/${tenantId}/appointments`)
        .where("scheduledAt", "<=", tomorrow)
        .where("scheduledAt", ">", now)
        .where("status", "in", ["scheduled", "confirmed"])
        .where("remindersSent.twentyFourHour", "==", false)
        .get();

      for (const apptDoc of upcomingAppts.docs) {
        const appt = apptDoc.data();
        const lead = await loadLead(tenantId, appt.leadId);
        await sendAppointmentReminder(tenantDoc.data(), lead, appt, "24hr");
        await apptDoc.ref.update({ "remindersSent.twentyFourHour": true });
      }

      // 1-hour reminders (separate check for precision)
      const oneHourOut = Timestamp.fromMillis(Date.now() + 65 * 60 * 1000);
      const soonAppts = await db.collection(`tenants/${tenantId}/appointments`)
        .where("scheduledAt", "<=", oneHourOut)
        .where("scheduledAt", ">", now)
        .where("status", "in", ["scheduled", "confirmed"])
        .where("remindersSent.oneHour", "==", false)
        .get();

      for (const apptDoc of soonAppts.docs) {
        const appt = apptDoc.data();
        const lead = await loadLead(tenantId, appt.leadId);
        await sendAppointmentReminder(tenantDoc.data(), lead, appt, "1hr");
        await apptDoc.ref.update({ "remindersSent.oneHour": true });
      }
    }

    // 2. MONTHLY USAGE COUNTER RESET
    // Reset counters on the 1st of each month
    const today = new Date();
    if (today.getUTCDate() === 1) {
      const batch = db.batch();
      const tenants = await db.collection("tenants").get();
      for (const doc of tenants.docs) {
        batch.update(doc.ref, {
          "usage.leadsThisMonth": 0,
          "usage.whatsappConversations": 0,
          "usage.aiTokensConsumed": 0,
          "usage.appointmentsBooked": 0,
          "usage.lastResetAt": FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    // 3. DUNNING: RETRY FAILED PAYMENTS
    const suspendedTenants = await db.collection("tenants")
      .where("status", "==", "suspended")
      .get();
    for (const doc of suspendedTenants.docs) {
      await retryFailedPayment(doc.data());
    }

    // 4. STALE LEAD CLEANUP
    // Mark leads with no activity in 30 days as cold
    const thirtyDaysAgo = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const tenantDoc of allTenants.docs) {
      const staleLeads = await db.collection(`tenants/${tenantDoc.id}/leads`)
        .where("conversation.lastMessageAt", "<", thirtyDaysAgo)
        .where("status", "not-in", ["closed", "dead"])
        .get();
      const batch = db.batch();
      for (const leadDoc of staleLeads.docs) {
        batch.update(leadDoc.ref, { "qualification.urgency": "cold" });
      }
      if (!staleLeads.empty) await batch.commit();
    }

    // 5. NDPR DELETION EXECUTION
    // Execute deletions that have passed their 30-day deadline
    const deletionLogs = await db.collection("compliance_log")
      .where("eventType", "==", "deletion_requested")
      .where("timestamp", "<", thirtyDaysAgo)
      .get();
    for (const log of deletionLogs.docs) {
      const logData = log.data();
      if (logData.leadId) {
        await deleteLeadData(logData.tenantId, logData.leadId);
        await logComplianceEvent(logData.tenantId, null, "deletion_completed", "info", {
          description: `Auto-executed NDPR deletion for lead ${logData.leadId}`,
        });
      }
    }

    console.log("Daily batch jobs completed.");
  });

// SUPPLEMENTARY: Hourly reminder check (more precise for 1-hour reminders)
export const hourlyReminderCheck = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    // Focused check for 1-hour appointment reminders
    // Same logic as above but scoped to appointments in next 75 minutes
  });
```

---

## 4. API Endpoint Definitions

### Webhook URLs (HTTP Triggers)

All webhooks are deployed as Firebase Cloud Functions under the project's default region.

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `https://us-central1-agentflowai-11dd2.cloudfunctions.net/whatsappWebhook` | GET | Meta webhook verification (hub.challenge) | Verify token |
| `https://us-central1-agentflowai-11dd2.cloudfunctions.net/whatsappWebhook` | POST | Inbound WhatsApp messages | X-Hub-Signature-256 |
| `https://us-central1-agentflowai-11dd2.cloudfunctions.net/paystackWebhook` | POST | Paystack payment events | x-paystack-signature |
| `https://us-central1-agentflowai-11dd2.cloudfunctions.net/stripeWebhook` | POST | Stripe payment events | stripe-signature |
| `https://us-central1-agentflowai-11dd2.cloudfunctions.net/leadIngestion` | POST | External lead sources | API key query param |

### Callable Functions (Firebase SDK)

Called from the React frontend via `firebase.functions().httpsCallable()`.

| Function Name | Purpose | Input | Output |
|---------------|---------|-------|--------|
| `provisionTenant` | Create tenant on signup | `{ market: string }` | `{ success, tenantId }` |
| `aiConversationOrchestrator` | Process AI conversation turn | `{ tenantId, leadId, inboundMessage }` | `{ status, tokensUsed }` |
| `calendarManager` | Calendar operations | `{ action, tenantId, leadId, appointmentData }` | Varies by action |
| `initializePayment` | Start payment flow | `{ tier: string }` | `{ authorizationUrl }` or `{ sessionId, url }` |
| `complianceLogger` | Log compliance events | `{ action, tenantId, leadId, eventData }` | `{ logId }` or report data |

### External Lead Source Webhooks

Generated per-tenant with unique API key:

```
POST https://us-central1-agentflowai-11dd2.cloudfunctions.net/leadIngestion
  ?source=property-finder
  &key={tenant_api_key}

POST https://us-central1-agentflowai-11dd2.cloudfunctions.net/leadIngestion
  ?source=bayut
  &key={tenant_api_key}

POST https://us-central1-agentflowai-11dd2.cloudfunctions.net/leadIngestion
  ?source=nigerian-property-centre
  &key={tenant_api_key}
```

### Scheduled Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `dailyBatchJobs` | `every day 02:00 UTC` | Usage resets, stale lead cleanup, NDPR deletions, dunning |
| `hourlyReminderCheck` | `every 15 minutes` | Appointment reminders (24hr and 1hr) |

---

## 5. Authentication & Authorization Model

### Firebase Auth Configuration

**Provider:** Email/Password (primary), Google OAuth (optional), Microsoft OAuth (optional for Outlook)

```typescript
// Firebase Auth setup
// Enabled providers: email/password, google.com
// Custom claims set on tenant provisioning:
{
  tenantId: string;    // The user's own tenant ID (same as UID for admin)
  role: "admin" | "agent";
  market: "nigeria" | "dubai";
}
```

### Auth Flow

```
1. User signs up via Firebase Auth (email/password)
   -> Firebase creates Auth user with UID
   -> Frontend calls provisionTenant({ market })
   -> Cloud Function creates /tenants/{uid} document
   -> Cloud Function sets custom claims: { tenantId: uid, role: "admin", market }
   -> User forced to re-authenticate to pick up new claims

2. Team member invited (Team/Brokerage tier)
   -> Admin invites via email
   -> Invited user signs up via Firebase Auth
   -> Cloud Function sets custom claims: { tenantId: adminTenantId, role: "agent", market }
   -> Agent's UID added to /tenants/{adminTenantId}/team/agents
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---

    // Get the authenticated user's tenant ID from custom claims
    function getTenantId() {
      return request.auth.token.tenantId;
    }

    // Check if user is admin of their tenant
    function isAdmin() {
      return request.auth.token.role == "admin";
    }

    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null && request.auth.token.tenantId != null;
    }

    // Verify the document belongs to the user's tenant
    function isTenantOwner(tenantId) {
      return isAuthenticated() && getTenantId() == tenantId;
    }

    // --- Market Config (read-only for all authenticated users) ---
    match /market_config/{marketId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Admin SDK only (seeded at deploy)
    }

    // --- Tenants ---
    match /tenants/{tenantId} {
      // Tenant admin can read/write their own tenant doc
      allow read: if isTenantOwner(tenantId);
      allow create: if false;  // Created via Cloud Function only
      allow update: if isTenantOwner(tenantId)
        && request.resource.data.tenantId == resource.data.tenantId  // Cannot change tenantId
        && request.resource.data.market == resource.data.market;      // Cannot change market
      allow delete: if false;  // Never delete via client

      // --- Leads (subcollection) ---
      match /leads/{leadId} {
        allow read: if isTenantOwner(tenantId);
        allow create: if isTenantOwner(tenantId)
          && request.resource.data.tenantId == tenantId;
        allow update: if isTenantOwner(tenantId)
          && request.resource.data.tenantId == resource.data.tenantId;
        allow delete: if false;  // Deletion via Cloud Function only (NDPR)

        // --- Messages (sub-subcollection) ---
        match /messages/{messageId} {
          allow read: if isTenantOwner(tenantId);
          allow create: if isTenantOwner(tenantId)
            && request.resource.data.tenantId == tenantId;
          allow update: if false;  // Messages are append-only
          allow delete: if false;  // Audit trail integrity
        }
      }

      // --- Appointments (subcollection) ---
      match /appointments/{appointmentId} {
        allow read: if isTenantOwner(tenantId);
        allow create: if isTenantOwner(tenantId)
          && request.resource.data.tenantId == tenantId;
        allow update: if isTenantOwner(tenantId)
          && request.resource.data.tenantId == resource.data.tenantId;
        allow delete: if false;
      }
    }

    // --- Phone Mappings (Cloud Functions only) ---
    match /phone_mappings/{phoneNumberId} {
      allow read, write: if false;  // Admin SDK only
    }

    // --- Usage Logs (read for tenant, write via Cloud Functions only) ---
    match /usage_logs/{logId} {
      allow read: if isAuthenticated()
        && resource.data.tenantId == getTenantId();
      allow write: if false;  // Cloud Functions only
    }

    // --- Compliance Logs (read for tenant admin, write via Cloud Functions only) ---
    match /compliance_log/{logId} {
      allow read: if isAuthenticated()
        && resource.data.tenantId == getTenantId()
        && isAdmin();
      allow write: if false;  // Cloud Functions only
    }

    // --- Default deny all ---
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Key Security Principles

1. **Tenant ID as partition key:** Every document includes `tenantId`. Security rules compare `request.auth.token.tenantId` against document `tenantId`.
2. **Market immutability:** Once set during provisioning, the `market` field cannot be changed via client writes.
3. **Append-only messages:** Messages cannot be updated or deleted from the client. This preserves the audit trail for RERA compliance.
4. **Server-only writes for sensitive collections:** `phone_mappings`, `usage_logs`, `compliance_log` are writable only via Cloud Functions (Admin SDK bypasses rules).
5. **No cross-tenant queries:** Leads, appointments, and messages are subcollections under `/tenants/{tenantId}/`, making cross-tenant access structurally impossible from the client.

---

## 6. Integration Architecture

### 6.1 WhatsApp Business API (Meta Cloud API)

**API Version:** v18+
**Base URL:** `https://graph.facebook.com/v18.0`

```
Inbound Flow:
Meta Server --POST--> /whatsappWebhook (Cloud Function)
  Headers: X-Hub-Signature-256 (HMAC-SHA256 of payload with app secret)
  Body: { entry: [{ changes: [{ value: { messages: [...], statuses: [...] } }] }] }

Outbound Flow:
Cloud Function --POST--> https://graph.facebook.com/v18.0/{phoneNumberId}/messages
  Headers: Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
  Body: {
    messaging_product: "whatsapp",
    to: "{recipientPhone}",
    type: "text" | "template" | "image" | "document",
    text?: { body: "message" },
    template?: { name: "template_name", language: { code: "en" }, components: [...] }
  }

Media Download:
Cloud Function --GET--> https://graph.facebook.com/v18.0/{mediaId}
  Headers: Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
  Response: { url: "https://..." }
  Then: GET {url} to download media binary
```

**Conversation Window Logic:**
```typescript
function isWithinFreeWindow(lead: Lead): boolean {
  if (!lead.conversation.windowExpiresAt) return false;
  return lead.conversation.windowExpiresAt.toMillis() > Date.now();
}

// If outside window, must use template message (higher cost)
// If inside window, can send free-form text (utility pricing)
```

### 6.2 Anthropic Claude API

**SDK:** `@anthropic-ai/sdk`
**Model:** `claude-sonnet-4-20250514` (balances quality and cost for real-time conversations)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: await getSecret("CLAUDE_API_KEY") });

// Conversation turn
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: systemPrompt,        // Market-specific persona prompt
  messages: [
    // Full conversation history from Firestore
    { role: "user", content: "I dey look for 3-bedroom flat in Lekki" },
    { role: "assistant", content: "Welcome! I'm Chioma..." },
    { role: "user", content: latestMessage },
  ],
});

// Entity extraction (separate call or structured output)
const extractionResponse = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 512,
  system: "Extract structured data from this real estate conversation. Return JSON.",
  messages: [{ role: "user", content: JSON.stringify(conversationHistory) }],
});
```

**Retry Strategy:**
```typescript
async function callClaudeWithRetry(params: MessageCreateParams, maxRetries = 3): Promise<Message> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(delay);
    }
  }
}
```

### 6.3 Paystack (Nigeria Payments)

**API Base:** `https://api.paystack.co`
**Auth:** `Authorization: Bearer {PAYSTACK_SECRET_KEY}`

```
Initialize Transaction:
POST /transaction/initialize
  Body: { email, amount (kobo), currency: "NGN", channels, metadata: { tenantId, tier }, callback_url }
  Response: { data: { authorization_url, reference } }

Verify Transaction:
GET /transaction/verify/{reference}
  Response: { data: { status: "success", amount, currency, metadata } }

Webhook Events:
  charge.success -> activate subscription
  invoice.payment_failed -> dunning flow
  subscription.disable -> cancel subscription
```

### 6.4 Stripe (Dubai Payments)

**SDK:** `stripe` (Node.js)
**API Version:** `2023-10-16+`

```
Create Checkout Session:
stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "subscription",
  line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
  metadata: { tenantId, tier },
  success_url, cancel_url,
})

Webhook Events:
  payment_intent.succeeded -> activate subscription
  invoice.paid -> renew subscription
  invoice.payment_failed -> dunning flow
  customer.subscription.deleted -> cancel subscription
```

### 6.5 Google Calendar API

**API Version:** v3
**Auth:** OAuth2 with offline refresh tokens

```typescript
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  await getSecret("GOOGLE_CLIENT_ID"),
  await getSecret("GOOGLE_CLIENT_SECRET"),
  "https://agentflowai-11dd2.web.app/auth/google/callback"
);

// Set credentials from stored refresh token
oauth2Client.setCredentials({ refresh_token: tenant.integrations.calendar.google.refreshToken });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Check availability (free/busy)
const freeBusy = await calendar.freebusy.query({
  requestBody: {
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    items: [{ id: "primary" }],
  },
});

// Create event
const event = await calendar.events.insert({
  calendarId: "primary",
  requestBody: {
    summary: `[AgentFlow] Viewing - ${leadName}`,
    description: eventDescription,
    start: { dateTime: startTime, timeZone: tenant.config.timezone },
    end: { dateTime: endTime, timeZone: tenant.config.timezone },
    location: address,
  },
});
```

### 6.6 Microsoft Graph API (Outlook Calendar)

**Auth:** OAuth2 with MSAL (Microsoft Authentication Library)

```typescript
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: await getSecret("MS_CLIENT_ID"),
    clientSecret: await getSecret("MS_CLIENT_SECRET"),
    authority: "https://login.microsoftonline.com/common",
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

// Exchange refresh token for access token
const tokenResponse = await cca.acquireTokenByRefreshToken({
  refreshToken: tenant.integrations.calendar.outlook.refreshToken,
  scopes: ["Calendars.ReadWrite"],
});

// Check availability
const scheduleResponse = await axios.post(
  "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
  {
    schedules: [tenant.integrations.calendar.outlook.email],
    startTime: { dateTime: start, timeZone: tenant.config.timezone },
    endTime: { dateTime: end, timeZone: tenant.config.timezone },
  },
  { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } }
);

// Create event
const event = await axios.post(
  "https://graph.microsoft.com/v1.0/me/events",
  {
    subject: `[AgentFlow] Viewing - ${leadName}`,
    body: { contentType: "HTML", content: eventDescription },
    start: { dateTime: startTime, timeZone: tenant.config.timezone },
    end: { dateTime: endTime, timeZone: tenant.config.timezone },
    location: { displayName: address },
  },
  { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } }
);
```

### Integration Circuit Breaker Pattern

Applied to all external API calls (WhatsApp, Claude, Paystack, Stripe, Google, Microsoft):

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly cooldownMs = 30_000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failureCount >= this.threshold) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.cooldownMs) {
        throw new Error("Circuit breaker open -- service temporarily unavailable");
      }
      this.failureCount = 0; // Reset after cooldown
    }

    try {
      const result = await fn();
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }
}

// Usage
const whatsappBreaker = new CircuitBreaker();
const claudeBreaker = new CircuitBreaker();
const paystackBreaker = new CircuitBreaker();
const stripeBreaker = new CircuitBreaker();
const googleCalBreaker = new CircuitBreaker();
const outlookBreaker = new CircuitBreaker();
```

---

## 7. Frontend Architecture

### Technology Stack

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS v3 with custom design tokens
- **Build Tool:** Vite
- **Hosting:** Firebase Hosting (CDN-backed)
- **State Management:** React Context + Firestore real-time listeners (`onSnapshot`)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Calendar UI:** FullCalendar or react-big-calendar
- **Charts:** Recharts

### Project Structure

```
src/
├── main.tsx                          # App entry point
├── App.tsx                           # Root component with router
├── firebase.ts                       # Firebase initialization
│
├── contexts/
│   ├── AuthContext.tsx                # Firebase Auth state, login/logout
│   ├── TenantContext.tsx             # Current tenant data (real-time)
│   └── MarketContext.tsx             # Market config loaded once
│
├── hooks/
│   ├── useAuth.ts                    # Auth state hook
│   ├── useTenant.ts                  # Tenant data hook
│   ├── useLeads.ts                   # Leads collection with real-time + filters
│   ├── useMessages.ts               # Message subcollection listener
│   ├── useAppointments.ts           # Appointments collection listener
│   ├── useUsage.ts                  # Usage logs aggregation
│   └── useCallable.ts              # Generic Cloud Function caller
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx            # Market selection during signup
│   │   └── ForgotPasswordPage.tsx
│   │
│   ├── onboarding/
│   │   ├── ProfileSetupPage.tsx      # FR3: Agent profile
│   │   ├── AIConfigPage.tsx          # FR4: AI persona settings
│   │   └── IntegrationSetupPage.tsx  # WhatsApp + Calendar + Payments
│   │
│   ├── dashboard/
│   │   └── DashboardPage.tsx         # FR61: Pipeline overview
│   │
│   ├── leads/
│   │   ├── LeadListPage.tsx          # FR15, FR20: Table with filters
│   │   ├── LeadDetailPage.tsx        # FR16, FR17: Full lead view
│   │   ├── LeadCreatePage.tsx        # FR12: Manual entry
│   │   └── ConversationPanel.tsx     # FR62: Real-time messages
│   │
│   ├── calendar/
│   │   └── CalendarPage.tsx          # FR45: Appointment calendar
│   │
│   ├── billing/
│   │   ├── BillingPage.tsx           # FR52: Subscription status
│   │   ├── PricingPage.tsx           # Tier selection
│   │   └── PaymentCallbackPage.tsx   # Paystack/Stripe redirect
│   │
│   ├── analytics/
│   │   ├── AnalyticsPage.tsx         # FR63: Performance analytics
│   │   └── UsagePage.tsx             # FR64: Usage metrics
│   │
│   ├── compliance/
│   │   └── CompliancePage.tsx        # FR59: Audit reports
│   │
│   ├── settings/
│   │   ├── SettingsPage.tsx          # Settings layout
│   │   ├── ProfileSettings.tsx       # Edit agent profile
│   │   ├── AISettings.tsx            # Edit AI config
│   │   ├── IntegrationSettings.tsx   # WhatsApp, Calendar, CRM
│   │   └── TeamSettings.tsx          # FR9: Team management
│   │
│   └── NotFoundPage.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Sidebar + header + main content
│   │   ├── Sidebar.tsx               # Navigation
│   │   ├── Header.tsx                # User menu, notifications
│   │   └── MobileNav.tsx
│   │
│   ├── leads/
│   │   ├── LeadTable.tsx             # Sortable, filterable table
│   │   ├── LeadFilters.tsx           # Market-aware filter controls
│   │   ├── LeadCard.tsx              # Summary card
│   │   ├── LeadScoreBadge.tsx        # Score + urgency visual
│   │   ├── LeadForm.tsx              # Create/edit form (market-aware fields)
│   │   └── LeadStatusPipeline.tsx    # Kanban-style status view
│   │
│   ├── conversation/
│   │   ├── MessageBubble.tsx         # AI/human/system differentiation
│   │   ├── MessageList.tsx           # Scrollable message thread
│   │   ├── MessageInput.tsx          # Agent reply input
│   │   ├── ConversationSummary.tsx   # AI-generated summary sidebar
│   │   ├── TakeOverButton.tsx        # FR28: Agent takeover
│   │   └── ApprovalQueue.tsx         # FR29: Pending AI messages
│   │
│   ├── calendar/
│   │   ├── CalendarView.tsx          # Month/week/day views
│   │   ├── AppointmentCard.tsx       # Appointment details
│   │   └── SlotPicker.tsx            # Available time slots
│   │
│   ├── billing/
│   │   ├── PricingCard.tsx           # Tier display (market-aware)
│   │   ├── BillingHistory.tsx        # Payment history table
│   │   └── UsageBar.tsx              # Usage vs limit indicator
│   │
│   ├── analytics/
│   │   ├── MetricCard.tsx            # KPI display
│   │   ├── LeadSourceChart.tsx       # Pie chart
│   │   ├── ConversionFunnel.tsx      # Funnel visualization
│   │   └── TimeSeriesChart.tsx       # Leads/appointments over time
│   │
│   ├── common/
│   │   ├── CurrencyDisplay.tsx       # FR67: Market-aware currency
│   │   ├── PhoneInput.tsx            # E.164 validation with market prefix
│   │   ├── MarketBadge.tsx           # Nigeria/Dubai indicator
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ProtectedRoute.tsx        # Auth guard
│   │
│   └── compliance/
│       ├── ConsentBanner.tsx          # NDPR consent display
│       ├── ComplianceReport.tsx       # Report viewer
│       └── ViolationLog.tsx           # Violation list
│
├── services/
│   ├── firebase.ts                   # Firebase app init + exports
│   ├── firestore.ts                  # Firestore helpers (typed collections)
│   ├── auth.ts                       # Auth helpers (signup, login, logout)
│   ├── functions.ts                  # Cloud Function callable wrappers
│   └── formatters.ts                 # Currency, date, phone formatters
│
├── utils/
│   ├── marketConfig.ts               # Market-specific field mappings
│   ├── validators.ts                 # Phone, email, E.164 validation
│   ├── constants.ts                  # Status enums, tier configs
│   └── types.ts                      # Shared TypeScript interfaces
│
└── styles/
    └── tailwind.css                  # Tailwind imports + custom styles
```

### Routing Configuration

```typescript
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    {/* Onboarding */}
    <Route path="/onboarding/profile" element={<ProfileSetupPage />} />
    <Route path="/onboarding/ai" element={<AIConfigPage />} />
    <Route path="/onboarding/integrations" element={<IntegrationSetupPage />} />

    {/* Main app */}
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/leads" element={<LeadListPage />} />
      <Route path="/leads/new" element={<LeadCreatePage />} />
      <Route path="/leads/:leadId" element={<LeadDetailPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/billing/callback" element={<PaymentCallbackPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/usage" element={<UsagePage />} />
      <Route path="/compliance" element={<CompliancePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/profile" element={<ProfileSettings />} />
      <Route path="/settings/ai" element={<AISettings />} />
      <Route path="/settings/integrations" element={<IntegrationSettings />} />
      <Route path="/settings/team" element={<TeamSettings />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### State Management Pattern

No Redux. Context + Firestore real-time listeners handle all state needs.

```typescript
// contexts/TenantContext.tsx
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTenant(null); setLoading(false); return; }

    // Real-time listener on tenant document
    const unsubscribe = onSnapshot(
      doc(db, "tenants", user.uid),
      (snap) => {
        setTenant(snap.exists() ? (snap.data() as Tenant) : null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

// hooks/useLeads.ts
export function useLeads(filters: LeadFilters) {
  const { tenant } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!tenant) return;

    let q = query(
      collection(db, `tenants/${tenant.tenantId}/leads`),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    if (filters.status) q = query(q, where("status", "==", filters.status));
    if (filters.urgency) q = query(q, where("qualification.urgency", "==", filters.urgency));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ ...d.data(), leadId: d.id } as Lead)));
    });

    return unsubscribe;
  }, [tenant, filters]);

  return leads;
}
```

### Market-Aware Component Pattern

```typescript
// components/common/CurrencyDisplay.tsx
export function CurrencyDisplay({ amount }: { amount: number }) {
  const { tenant } = useTenant();
  const { code, symbol, locale } = tenant?.config.currency || { code: "USD", symbol: "$", locale: "en-US" };

  return (
    <span>
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
      }).format(amount)}
    </span>
  );
}

// components/leads/LeadForm.tsx -- market-specific fields
function MarketSpecificFields({ market }: { market: string }) {
  if (market === "nigeria") {
    return (
      <>
        <SelectField label="Title Type" options={["c_of_o", "governors_consent", "deed", "survey_plan"]} />
        <SelectField label="Payment Plan" options={["outright", "installment", "mortgage"]} />
        <TextField label="Land Size" placeholder="e.g., 2 plots" />
        <CheckboxGroup label="Infrastructure Needs" options={["road", "water", "electricity", "security"]} />
      </>
    );
  }
  if (market === "dubai") {
    return (
      <>
        <ToggleField label="Off-Plan" />
        <ToggleField label="Freehold Required" />
        <SelectField label="Investment Type" options={["primary_residence", "investment", "holiday_home"]} />
        <NumberField label="Target Yield (%)" />
        <ToggleField label="Islamic Finance Interest" />
      </>
    );
  }
  return null;
}
```

---

## 8. Security Architecture

### 8.1 Secret Management

All secrets stored in Google Cloud Secret Manager, accessed via Cloud Functions only.

| Secret Name | Description | Used By |
|-------------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key | `aiConversationOrchestrator` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API permanent token | `whatsappWebhook`, AI orchestrator |
| `WHATSAPP_APP_SECRET` | Meta app secret for signature verification | `whatsappWebhook` |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | `whatsappWebhook` (GET) |
| `PAYSTACK_SECRET_KEY` | Paystack API secret | `paymentProcessor`, `paystackWebhook` |
| `STRIPE_SECRET_KEY` | Stripe API secret | `paymentProcessor`, `stripeWebhook` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `stripeWebhook` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `calendarManager` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `calendarManager` |
| `MS_CLIENT_ID` | Microsoft Azure AD app client ID | `calendarManager` |
| `MS_CLIENT_SECRET` | Microsoft Azure AD app client secret | `calendarManager` |

**Access Pattern:**
```typescript
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/agentflowai-11dd2/secrets/${name}/versions/latest`,
  });
  return version.payload?.data?.toString() || "";
}
```

### 8.2 Tenant Isolation

**Layer 1 -- Firestore Structure:** Leads, messages, and appointments are subcollections under `/tenants/{tenantId}/`. This makes cross-tenant queries structurally impossible from the client SDK.

**Layer 2 -- Security Rules:** Every read/write rule checks `request.auth.token.tenantId == tenantId` path parameter. Custom claims are set server-side and cannot be forged.

**Layer 3 -- Cloud Functions:** All Cloud Functions validate `tenantId` from auth context before any data access. The Admin SDK bypasses rules, so functions must self-enforce.

**Layer 4 -- Phone Mapping Isolation:** The `phone_mappings` collection (used for WhatsApp routing) is write-only via Admin SDK. No client can read other tenants' phone number mappings.

### 8.3 Webhook Verification

**WhatsApp (Meta):**
```typescript
function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
```

**Paystack:**
```typescript
function verifyPaystackSignature(body: any, signature: string, secret: string): boolean {
  const hash = crypto.createHmac("sha512", secret)
    .update(JSON.stringify(body))
    .digest("hex");
  return hash === signature;
}
```

**Stripe:**
```typescript
// Uses Stripe SDK built-in verification
const event = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
// Throws if invalid
```

### 8.4 CORS Configuration

```typescript
// functions/src/index.ts
import cors from "cors";

const corsHandler = cors({
  origin: [
    "https://agentflowai-11dd2.web.app",
    "https://agentflowai-11dd2.firebaseapp.com",
    // Development
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
```

Note: Callable functions handle CORS automatically via the Firebase SDK. CORS middleware is applied only to HTTP trigger functions that the browser calls directly (none in the current architecture -- all browser-to-function calls use callables).

### 8.5 Rate Limiting

```typescript
// Applied to all HTTP trigger endpoints
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
```

### 8.6 Data Encryption

- **At rest:** Firestore encrypts all data at rest by default (Google-managed encryption keys).
- **In transit:** All communication uses HTTPS/TLS 1.2+. Firebase Hosting enforces HTTPS. Cloud Functions endpoints are HTTPS-only.
- **Sensitive fields:** Calendar refresh tokens are stored in Firestore but should be treated as sensitive. For MVP, rely on Firestore's at-rest encryption. For Vision phase, consider encrypting refresh tokens with a project-level key before storage.

---

## 9. Data Flow Diagrams

### 9.1 Lead Qualification Flow

```
+-------------------+
| Lead sends        |
| WhatsApp message  |
+-------------------+
        |
        v
+-------------------+     +-----------------------+
| Meta Cloud API    |---->| whatsappWebhook CF    |
| (webhook POST)    |     |                       |
+-------------------+     | 1. Verify signature   |
                          | 2. Parse message      |
                          | 3. Lookup tenant via   |
                          |    phone_mappings      |
                          | 4. Find/create lead    |
                          | 5. Store inbound msg   |
                          | 6. Update window timer |
                          +-----------+-----------+
                                      |
                                      v
                          +-----------+-----------+
                          | aiConversationOrch.   |
                          |                       |
                          | 1. Load tenant config  |
                          | 2. Load lead + history |
                          | 3. Check AI active?    |
                          | 4. Build system prompt |
                          |    (market-specific)   |
                          | 5. Call Claude API     |
                          |    with conversation   |
                          |    history             |
                          +-----------+-----------+
                                      |
                          +-----------+-----------+
                          | Claude API Response   |
                          |                       |
                          | - AI reply text       |
                          | - Entity extraction   |
                          | - Score update        |
                          +-----------+-----------+
                                      |
                                      v
                          +-----------+-----------+
                          | Compliance Check      |
                          |                       |
                          | Nigeria: fraud scan   |
                          | Dubai: RERA scan      |
                          |                       |
                          | passed -> continue    |
                          | flagged -> log + send |
                          | blocked -> rewrite    |
                          +-----------+-----------+
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
          +-------------------+             +-------------------+
          | If approval mode: |             | If auto mode:     |
          | Store as pending  |             | Send via WhatsApp |
          | Notify agent      |             | API               |
          +-------------------+             +-------------------+
                                                      |
                                                      v
                                            +-------------------+
                                            | Store outbound    |
                                            | message doc       |
                                            | Update lead score |
                                            | Log usage         |
                                            | Log compliance    |
                                            +-------------------+
```

### 9.2 Appointment Booking Flow

```
+---------------------------+
| AI determines lead is     |
| qualified (score >= 60)   |
| Lead expresses interest   |
| in viewing                |
+---------------------------+
        |
        v
+---------------------------+
| calendarManager           |
| action: checkAvailability |
|                           |
| 1. Fetch Google Calendar  |
|    free/busy              |
| 2. Fetch Outlook Calendar |
|    free/busy (if connected)|
| 3. Merge busy times       |
| 4. Apply cultural blocks: |
|    - Dubai: Fri 12-2 PM  |
|    - Nigeria: public hols |
| 5. Apply weekend rules:  |
|    - Dubai: Fri-Sat      |
|    - Nigeria: Sat-Sun    |
| 6. Return available slots |
+---------------------------+
        |
        v
+---------------------------+
| AI suggests 2-3 slots    |
| via WhatsApp conversation |
| with market context:      |
|                           |
| NG: "Saturday 10 AM good?|
|  Avoid Third Mainland rush"|
| AE: "Tuesday 3 PM Dubai  |
|  time? (5:30 PM Mumbai)" |
+---------------------------+
        |
        v  (lead picks a time)
+---------------------------+
| calendarManager           |
| action: createAppointment |
|                           |
| 1. Create calendar event  |
|    on preferred provider  |
| 2. Create Firestore       |
|    appointment doc         |
| 3. Update lead status to  |
|    "appointment_set"      |
| 4. Send WhatsApp          |
|    confirmation to lead   |
| 5. Increment usage counter|
+---------------------------+
        |
        v
+---------------------------+
| Reminder Pipeline         |
| (dailyBatchJobs +         |
|  hourlyReminderCheck)     |
|                           |
| T-24hr: WhatsApp reminder |
| T-1hr:  WhatsApp reminder |
+---------------------------+
```

### 9.3 Payment Processing Flow

```
Nigeria (Paystack)                    Dubai (Stripe)
==================                    ==============

Agent selects tier                    Agent selects tier
        |                                     |
        v                                     v
+-------------------+              +-------------------+
| initializePayment |              | initializePayment |
| (callable CF)     |              | (callable CF)     |
|                   |              |                   |
| POST /transaction |              | stripe.checkout   |
| /initialize       |              | .sessions.create  |
| amount in kobo    |              | amount in fils    |
| currency: NGN     |              | currency: AED     |
| channels: card,   |              | mode: subscription|
|   bank, ussd,     |              |                   |
|   mobile_money    |              |                   |
+-------------------+              +-------------------+
        |                                     |
        v                                     v
+-------------------+              +-------------------+
| Paystack Checkout |              | Stripe Checkout   |
| (redirect)        |              | (redirect/embed)  |
+-------------------+              +-------------------+
        |                                     |
        v  (on success)                       v  (on success)
+-------------------+              +-------------------+
| Paystack webhook  |              | Stripe webhook    |
| charge.success    |              | invoice.paid      |
|                   |              |                   |
| 1. Verify sig     |              | 1. Verify sig     |
| 2. Idempotency    |              | 2. Idempotency    |
| 3. Activate sub   |              | 3. Activate sub   |
| 4. Update tenant: |              | 4. Update tenant: |
|    status: active  |              |    status: active  |
|    tier: selected  |              |    tier: selected  |
|    periodEnd: date |              |    periodEnd: date |
| 5. WhatsApp       |              | 5. WhatsApp       |
|    receipt         |              |    receipt         |
+-------------------+              +-------------------+

Failed Payment (both):
+-------------------+
| Webhook: failed   |
|                   |
| 1. Log failure    |
| 2. WhatsApp       |
|    notification   |
| 3. Retry schedule:|
|    Day 1, 3, 7    |
| 4. After 3 fails: |
|    status:suspended|
|    AI paused       |
+-------------------+
```

---

## 10. Deployment Architecture

### Firebase Hosting

```
Firebase Hosting
├── Source: /dist (Vite build output)
├── Domain: agentflowai-11dd2.web.app
├── CDN: Global edge caching
├── HTTPS: Enforced (auto TLS)
└── SPAs: Rewrites all routes to index.html
```

**firebase.json (Hosting section):**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|svg|png|jpg|ico|woff2)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ]
  }
}
```

### Cloud Functions

```
Cloud Functions
├── Runtime: Node.js 20 (LTS)
├── Region: us-central1 (default; consider europe-west1 for lower latency to Africa/ME)
├── Memory: 256MB default, 512MB for AI orchestrator
├── Timeout: 60s default, 120s for AI orchestrator
├── Min instances: 1 for whatsappWebhook (avoid cold start on webhook)
└── Concurrency: default (80 concurrent per instance)
```

**functions/package.json (key dependencies):**
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@google-cloud/secret-manager": "^5.0.0",
    "googleapis": "^130.0.0",
    "@azure/msal-node": "^2.0.0",
    "stripe": "^14.0.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "firebase-functions-test": "^3.0.0"
  }
}
```

### Deployment Pipeline

```
Local Development:
  firebase emulators:start --only auth,firestore,functions,hosting
  (Emulator Suite for local testing)

Staging:
  firebase deploy --only firestore:rules    # Deploy security rules
  firebase deploy --only functions           # Deploy Cloud Functions
  npm run build && firebase deploy --only hosting  # Deploy frontend

Production:
  Same commands targeting the production project
  CI/CD via GitHub Actions recommended:

  1. On PR: Run tests + lint + type check
  2. On merge to main:
     a. npm run build
     b. firebase deploy --only firestore:rules,functions,hosting --token $FIREBASE_TOKEN
```

### Firebase Project Structure

```
/agentflowai (repo root)
├── firebase.json                     # Firebase project config
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Composite index definitions
├── .firebaserc                       # Project aliases
│
├── functions/                        # Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                  # Export all functions
│       ├── config/
│       │   └── secrets.ts            # Secret Manager helpers
│       ├── tenant/
│       │   └── provisionTenant.ts
│       ├── whatsapp/
│       │   ├── whatsappWebhook.ts
│       │   ├── sendMessage.ts
│       │   └── mediaHandler.ts
│       ├── ai/
│       │   ├── aiConversationOrchestrator.ts
│       │   ├── promptBuilder.ts
│       │   ├── entityExtractor.ts
│       │   └── complianceChecker.ts
│       ├── leads/
│       │   ├── leadIngestion.ts
│       │   └── leadHelpers.ts
│       ├── calendar/
│       │   ├── calendarManager.ts
│       │   ├── googleCalendar.ts
│       │   └── outlookCalendar.ts
│       ├── payments/
│       │   ├── paymentProcessor.ts
│       │   ├── paystackWebhook.ts
│       │   ├── stripeWebhook.ts
│       │   └── subscriptionHelpers.ts
│       ├── compliance/
│       │   └── complianceLogger.ts
│       ├── scheduled/
│       │   └── dailyBatchJobs.ts
│       └── shared/
│           ├── types.ts              # Shared TypeScript interfaces
│           ├── circuitBreaker.ts
│           ├── rateLimiter.ts
│           └── idempotency.ts
│
├── src/                              # React frontend
│   └── (see Frontend Architecture section)
│
├── package.json                      # Frontend dependencies
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── index.html
```

---

## 11. Environment Configuration & Firebase Config

### Firebase Client Configuration

```typescript
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBp4oB9xeQhcKBE9P3ySiwW0-NICL7WnuU",
  authDomain: "agentflowai-11dd2.firebaseapp.com",
  projectId: "agentflowai-11dd2",
  storageBucket: "agentflowai-11dd2.firebasestorage.app",
  messagingSenderId: "215598157674",
  appId: "1:215598157674:web:5747053918cbebe0215f13",
  measurementId: "G-XF7ST14FJF",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  import("firebase/auth").then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, "http://localhost:9099");
  });
  import("firebase/firestore").then(({ connectFirestoreEmulator }) => {
    connectFirestoreEmulator(db, "localhost", 8080);
  });
  import("firebase/functions").then(({ connectFunctionsEmulator }) => {
    connectFunctionsEmulator(functions, "localhost", 5001);
  });
}
```

### .firebaserc

```json
{
  "projects": {
    "default": "agentflowai-11dd2"
  }
}
```

### firebase.json

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint",
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### Market Config Seed Data

Deployed during initial setup via a seed script or the Firebase console.

```typescript
// scripts/seedMarketConfig.ts
// Run: npx ts-node scripts/seedMarketConfig.ts

const nigeriaConfig: MarketConfig = {
  marketId: "nigeria",
  displayName: "Nigeria",
  region: "africa-west",
  currency: { code: "NGN", symbol: "₦", locale: "en-NG" },
  timezone: "Africa/Lagos",
  weekend: ["sat", "sun"],
  dateFormat: "DD/MM/YYYY",
  compliance: {
    framework: "NDPR",
    consentRequired: true,
    auditRetentionYears: 1,
    blockedPhrases: [],
  },
  ai: {
    defaultPersona: "Chioma",
    systemPromptTemplate: "...", // Full Chioma system prompt
    qualificationQuestions: [
      "What is your budget range?",
      "Are you looking to buy outright or on an installment plan?",
      "What type of property are you interested in?",
      "Which areas are you considering?",
      "What title type do you prefer (C of O, Governor's Consent)?",
      "Do you need an estate with good road, water, and security?",
      "What is your timeline for this purchase?",
    ],
    escalationTriggers: [
      "distress sale", "urgent sale", "commission upfront",
      "bank details", "send money", "western union",
    ],
  },
  whatsapp: { utilityRate: 0.0067, marketingRate: 0.0516 },
  subscriptionTiers: {
    solo: { price: 25000, leadsPerMonth: 100, maxAgents: 1 },
    team: { price: 75000, leadsPerMonth: 500, maxAgents: 5 },
    brokerage: { price: 200000, leadsPerMonth: -1, maxAgents: -1 }, // -1 = unlimited
  },
  phonePrefix: "+234",
  areas: ["Lekki Phase 1", "Lekki Phase 2", "Ikoyi", "Victoria Island", "Ajah", "Banana Island",
          "Ikeja GRA", "Magodo", "Surulere", "Maitama", "Asokoro", "Gwarinpa", "Wuse"],
  propertyTypes: ["apartment", "detached_house", "semi_detached", "terrace", "land", "commercial", "office"],
  culturalBlocks: { enabled: false, blocks: [] },
};

const dubaiConfig: MarketConfig = {
  marketId: "dubai",
  displayName: "Dubai",
  region: "mena",
  currency: { code: "AED", symbol: "AED", locale: "en-AE" },
  timezone: "Asia/Dubai",
  weekend: ["fri", "sat"],
  dateFormat: "DD/MM/YYYY",
  compliance: {
    framework: "RERA",
    consentRequired: false,
    auditRetentionYears: 5,
    blockedPhrases: [
      "guaranteed returns", "assured yield", "guaranteed ROI",
      "100% returns", "risk-free investment", "guaranteed profit",
      "as an Indian buyer", "as a British buyer", "as a Russian buyer",
    ],
  },
  ai: {
    defaultPersona: "Aisha",
    systemPromptTemplate: "...", // Full Aisha system prompt
    qualificationQuestions: [
      "What is your budget range in AED?",
      "Are you interested in off-plan or ready properties?",
      "Which areas are you considering?",
      "Is this for your primary residence, investment, or holiday home?",
      "Do you have a preference for freehold properties?",
      "What rental yield are you targeting?",
      "Are you interested in Islamic finance options?",
      "What is your preferred timeline or handover date?",
    ],
    escalationTriggers: [
      "guaranteed returns", "guaranteed ROI", "bypass documentation",
      "cash only", "no documentation", "under the table",
    ],
  },
  whatsapp: { utilityRate: 0.0107, marketingRate: 0.0455 },
  subscriptionTiers: {
    solo: { price: 179, leadsPerMonth: 100, maxAgents: 1 },
    team: { price: 499, leadsPerMonth: 500, maxAgents: 5 },
    brokerage: { price: 1299, leadsPerMonth: -1, maxAgents: -1 },
  },
  phonePrefix: "+971",
  areas: ["Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "JVC", "JBR", "Business Bay",
          "Arabian Ranches", "Dubai Hills", "DIFC", "Al Barsha", "Jumeirah", "Dubai Creek Harbour"],
  propertyTypes: ["apartment", "villa", "townhouse", "penthouse", "studio", "commercial", "office"],
  culturalBlocks: {
    enabled: true,
    blocks: [
      { day: "friday", start: "12:00", end: "14:00", reason: "Jumu'ah prayer" },
    ],
  },
};
```

### Environment Variables (Cloud Functions)

Cloud Functions access secrets at runtime via Secret Manager. No `.env` files in production.

For local development with emulators, create `functions/.env.local`:

```
# functions/.env.local (LOCAL DEVELOPMENT ONLY -- never commit)
CLAUDE_API_KEY=sk-ant-xxx-dev
WHATSAPP_ACCESS_TOKEN=dev-token
WHATSAPP_APP_SECRET=dev-secret
WHATSAPP_VERIFY_TOKEN=dev-verify
PAYSTACK_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
MS_CLIENT_ID=xxx
MS_CLIENT_SECRET=xxx
```

### Firestore Indexes Configuration

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "qualification.urgency", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "qualification.score", "order": "DESCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "scheduledAt", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Appendix A: Cloud Function Exports

```typescript
// functions/src/index.ts
export { provisionTenant } from "./tenant/provisionTenant";
export { whatsappWebhook } from "./whatsapp/whatsappWebhook";
export { aiConversationOrchestrator } from "./ai/aiConversationOrchestrator";
export { leadIngestion } from "./leads/leadIngestion";
export { calendarManager } from "./calendar/calendarManager";
export { initializePayment } from "./payments/paymentProcessor";
export { paystackWebhook } from "./payments/paystackWebhook";
export { stripeWebhook } from "./payments/stripeWebhook";
export { complianceLogger } from "./compliance/complianceLogger";
export { dailyBatchJobs, hourlyReminderCheck } from "./scheduled/dailyBatchJobs";
```

## Appendix B: Key Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Firestore | Real-time listeners for dashboard, security rules for tenant isolation, serverless scaling |
| Functions runtime | Node.js 20 / TypeScript | Firebase native, strong typing, shared types with frontend |
| AI model | Claude Sonnet 4 | Best balance of quality, speed (<5s), and cost for real-time conversations |
| Auth | Firebase Auth + custom claims | Native integration, custom claims for tenant/role without extra DB reads |
| Payments | Paystack + Stripe | Paystack is the dominant payment gateway in Nigeria; Stripe is standard for UAE |
| Calendar | Google API + MS Graph | Cover both GSuite and Microsoft 365 users |
| Single project | agentflowai-11dd2 | MVP simplicity; regional projects deferred to Vision phase for data residency |
| Subcollections | leads, messages, appointments under tenants | Natural security boundary, efficient queries scoped to tenant |
| AI conversation state | Firestore (not in-memory) | Survives function restarts, supports concurrent conversations (NFR19) |
| Webhook idempotency | Firestore document check | Prevents double-processing of Paystack/Stripe/WhatsApp events (NFR17) |

---

*This architecture document serves as the implementation blueprint for AgentFlow AI. All code, configuration, and infrastructure decisions trace back to the PRD requirements and epic stories. Developers should reference this document alongside the PRD and epics when building any component.*
