---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - user-provided-architecture-spec (conversation)
  - firebase-config (conversation)
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: saas_b2b
  domain: proptech_fintech
  complexity: high
  projectContext: greenfield
---

# Product Requirements Document - AgentFlow AI

**Author:** joseph
**Date:** 2026-04-07

## Executive Summary

AgentFlow AI is a multi-tenant SaaS platform that provides real estate agents in Nigeria and Dubai with AI-powered lead qualification, conversation management, and appointment booking — delivered primarily through WhatsApp. The platform deploys market-specific AI personas (Chioma for Nigeria, Aisha for Dubai) that understand local culture, language nuances, property markets, and regulatory requirements while running on a single, market-agnostic codebase.

**Target users:** Independent real estate agents, teams, and brokerages operating in Lagos/Abuja (Nigeria) and Dubai (UAE) who receive high lead volumes and lose deals due to slow response times and inconsistent follow-up.

**Problem:** Real estate agents in emerging markets spend 60-80% of their time on unqualified leads. WhatsApp is the dominant communication channel in both Nigeria and Dubai, but agents lack tools to automate intelligent qualification conversations at scale while maintaining cultural authenticity and regulatory compliance.

### What Makes This Special

AgentFlow AI is not a generic chatbot bolted onto a CRM. Three core differentiators:

1. **Cultural AI Intelligence:** Chioma understands Nigerian Pidgin, Lagos traffic patterns, land title complexities (C of O vs Governor's Consent), and installment payment norms. Aisha understands Dubai's multicultural buyer mix, off-plan payment structures (50/50, post-handover), freehold zones, RERA advertising rules, and Ramadan/prayer time sensitivity. No competitor offers this depth of market-specific AI behavior.

2. **WhatsApp-Native Architecture:** Built for WhatsApp as the primary channel — not email with WhatsApp as an afterthought. Leverages the 24-hour free conversation window, handles voice messages, media sharing, and language detection natively.

3. **Multi-Market from Day One:** "Market" is a first-class configuration field, not a code fork. Adding Saudi Arabia, Kenya, or Egypt requires configuration changes — not a new codebase. Tenant isolation ensures compliance while the shared core maximizes code reuse (~80%).

## Project Classification

- **Project Type:** B2B SaaS Platform
- **Domain:** PropTech / FinTech (real estate + payments + compliance)
- **Complexity:** High — dual-market regulatory requirements (NDPR, RERA), payment processing (Paystack, Stripe), government integrations (Dubai REST, CAC), and AI conversation management
- **Project Context:** Greenfield — new platform built from scratch
- **Tech Stack:** Firebase (Firestore, Cloud Functions, Auth, Hosting) + React/TypeScript/Tailwind CSS + Anthropic Claude API + WhatsApp Business API
- **Firebase Project:** `agentflowai-11dd2`

## Success Criteria

### User Success

- Agent receives first AI-qualified lead summary within 5 minutes of lead ingestion (Nigeria) / 2 minutes (Dubai)
- Agent says "I closed a deal I would have missed" within first month of use
- Agent spends less than 20% of their time on unqualified leads (down from 60-80%)
- Agent trusts the AI enough to let it handle initial qualification without monitoring every message
- Appointment show rate exceeds 70% due to AI-managed confirmations and reminders

### Business Success

- **3-month target:** 50 paying tenants across both markets (30 Nigeria, 20 Dubai)
- **6-month target:** Tool ROI demonstrated — one closed deal pays for 2+ years of subscription (Nigeria: ₦2.5M commission vs ₦300K/year subscription; Dubai: AED 60K commission vs AED 2,148/year subscription)
- **12-month target:** Monthly churn below 8% (Nigeria) and 5% (Dubai)
- **Revenue metric:** Average appointment booking rate of 10% (Nigeria) and 15% (Dubai) of all ingested leads
- **Unit economics:** WhatsApp cost per lead below $0.05 (Nigeria) and $0.04 (Dubai)

### Technical Success

- Firestore security rules enforce complete tenant data isolation — zero cross-tenant data leakage
- WhatsApp message delivery success rate above 99%
- Cloud Functions cold start under 3 seconds; warm execution under 500ms
- Claude API response generation under 5 seconds per conversation turn
- System handles 100 concurrent WhatsApp conversations per tenant without degradation
- Zero compliance violations (NDPR for Nigeria, RERA for Dubai) in production

### Measurable Outcomes

| Metric | Nigeria Target | Dubai Target |
|--------|---------------|-------------|
| AI Response Time | < 5 minutes | < 2 minutes |
| Lead-to-Appointment Rate | 10% | 15% |
| WhatsApp Cost/Lead | $0.05 (utility) | $0.04 (utility) |
| Monthly Churn | < 8% | < 5% |
| Avg Deal Value | ₦50M (~$30K) | AED 3M (~$820K) |
| Tool ROI | 100x | 300x |

## Product Scope

### MVP - Minimum Viable Product

The MVP delivers the core value loop: lead comes in → AI qualifies via WhatsApp → agent gets summary → appointment booked.

**MVP Capabilities:**
- Tenant provisioning with market selection (Nigeria/Dubai)
- Firebase Auth for agent login
- Firestore data model with tenant isolation and market as first-class field
- WhatsApp Business API integration (inbound/outbound messaging)
- Claude-powered AI conversation with Chioma (Nigeria) and Aisha (Dubai) personas
- Lead ingestion from WhatsApp and manual entry
- AI-driven lead qualification with market-specific questions
- Lead scoring (0-100) with urgency classification (hot/warm/cold)
- Appointment booking with Google Calendar integration
- React dashboard: lead list, conversation view, appointment calendar
- Paystack subscription billing (Nigeria), Stripe subscription billing (Dubai)
- Basic usage tracking (leads, conversations, appointments)
- Firestore security rules for tenant isolation
- NDPR consent capture (Nigeria), RERA compliance guardrails (Dubai)

### Growth Features (Post-MVP)

- Lead ingestion from Property Finder, Bayut (Dubai), Nigerian Property Centre
- Voice call handling via Twilio (Nigeria) and Infobip (Dubai)
- Outlook calendar integration (Dubai priority)
- CRM integrations (Follow Up Boss, kvCORE, Chime, Property Finder, Bayut)
- Dubai REST government API integration for property verification
- CAC lookup for corporate buyer verification (Nigeria)
- Ejari auto-registration for tenancy contracts (Dubai)
- Team management with multiple agents per tenant
- Advanced analytics dashboard with currency conversion
- WhatsApp template message management
- Multi-language support: Arabic basics (Dubai), Pidgin/Hausa/Yoruba/Igbo (Nigeria)
- Appointment reminder automation (24hr, 1hr before)

### Vision (Future)

- Additional markets: Saudi Arabia, Kenya, Egypt, South Africa
- Regional Firebase projects for data residency (agentflow-ng, agentflow-ae)
- Global control plane for cross-market analytics
- AI voice personas with market-specific TTS (Arabic for Dubai)
- Off-plan investment yield calculator (Dubai)
- Mobile money deposit collection (Nigeria)
- Automated compliance audit report generation
- White-label option for brokerages
- API marketplace for third-party integrations

## User Journeys

### Journey 1: Adaeze — Nigerian Agent Getting Her First AI-Qualified Lead

**Who:** Adaeze is a solo real estate agent in Lekki, Lagos. She juggles 30+ WhatsApp conversations daily, mostly tire-kickers asking about properties they saw on Nigerian Property Centre. She loses real buyers because she can't respond fast enough while stuck in Third Mainland Bridge traffic.

**Opening Scene:** Adaeze signs up for AgentFlow AI during her lunch break. She selects "Nigeria" as her market, enters her LASG license number, connects her WhatsApp Business number, and links her Google Calendar. The system creates her tenant with NGN currency, Lagos timezone, and NDPR compliance flags. Chioma is activated as her AI assistant.

**Rising Action:** That evening, a lead named Emeka sends a WhatsApp message: "I dey look for 3-bedroom flat in Lekki Phase 1, my budget na around ₦50M." Chioma responds within 30 seconds — warmly greeting Emeka, confirming his budget range, asking about his payment preference (outright or installment), checking if he needs C of O or Governor's Consent properties, and whether he needs an estate with good road and steady light. Emeka responds in a mix of English and Pidgin. Chioma understands and continues the conversation naturally.

**Climax:** Chioma qualifies Emeka as a hot lead (score: 85/100) — genuine budget, clear timeline ("I wan relocate before December"), payment plan preference identified. Chioma suggests three available viewing times, accounting for Lagos traffic ("Is Saturday 10 AM good? That way we avoid the Third Mainland rush"). Emeka picks Saturday 11 AM. The appointment appears in Adaeze's Google Calendar with full qualification notes.

**Resolution:** Adaeze sees the appointment notification with Emeka's complete profile: budget ₦45-55M, Lekki Phase 1, 3-bed flat, installment payment preferred, C of O required, needs estate with security and water. She walks into the viewing fully prepared. Emeka signs a payment plan that week. Adaeze's ₦2.5M commission from this single deal pays for AgentFlow AI for 8 years.

### Journey 2: Hassan — Dubai Agent Handling International Investor via AI

**Who:** Hassan is a senior property consultant at a Dubai Marina brokerage. His leads come from Property Finder and Bayut — a mix of Indian investors, British expats, and Russian buyers. He needs to qualify nationality, investment intent, and freehold eligibility before any viewing.

**Opening Scene:** Hassan's brokerage admin sets up his AgentFlow AI tenant with "Dubai" market, RERA license number, AED currency, and connects both Google Calendar and Outlook (his brokerage uses Microsoft 365). Aisha is configured as his AI consultant with English as primary language and basic Arabic phrases enabled.

**Rising Action:** An Indian investor named Priya sends a WhatsApp inquiry about off-plan apartments in Dubai Marina. Aisha responds professionally, identifying Priya's nationality (relevant for freehold eligibility), confirming her budget (AED 2-3M), asking about investment goals (rental yield vs capital appreciation), timeline (handover Q4 2027 acceptable), and whether she needs Islamic finance options. Aisha references current 6-8% gross yields in Marina without making guarantees (RERA compliance).

**Climax:** Aisha qualifies Priya as warm-to-hot (score: 78/100) — real budget, clear investment thesis, but timeline is flexible. Aisha proposes a video call for Tuesday at 3 PM Dubai time (Priya is in Mumbai) — avoiding Friday 12-2 PM prayer time. She requests Priya's passport copy for RERA documentation. The appointment lands in Hassan's Outlook calendar with full investor profile.

**Resolution:** Hassan joins the video call knowing Priya's exact criteria: AED 2-3M off-plan in Marina or JBR, targeting 7%+ yield, payment plan preferred (50/50), freehold required, no Islamic finance needed. He presents three specific units. Priya reserves one that week. Hassan's AED 90K commission from this deal covers his entire team's AgentFlow subscription for 3 years.

### Journey 3: Admin — Brokerage Manager Configuring Multi-Agent Setup

**Who:** Fatima is the operations manager at a Dubai brokerage with 12 agents. She needs to onboard the team, configure shared settings, and monitor AI performance across all agents.

**Opening Scene:** Fatima signs up for the Brokerage tier, selects Dubai market, and enters the company's RERA brokerage license. She connects the brokerage's WhatsApp Business Account and Stripe billing.

**Rising Action:** Fatima configures tenant-level settings: default AI persona (Aisha), preferred calendar integration (Outlook), qualification threshold for human handoff (score > 60), and compliance guardrails (RERA strictness: high). She then invites her 12 agents, each getting their own sub-profile within the tenant.

**Climax:** After one month, Fatima reviews the analytics dashboard. She sees: 450 leads ingested, 67 appointments booked (14.9% rate), average response time 1.8 minutes, AED 12M in pipeline value. She identifies that Agent #7 has the lowest conversion rate and needs coaching on follow-up.

**Resolution:** Fatima exports the monthly compliance report showing all AI conversations passed RERA review. She presents ROI data to the brokerage owner: AED 2,500/month subscription generating AED 12M pipeline. The brokerage renews for annual billing at a discount.

### Journey 4: Support — Handling AI Escalation and Edge Cases

**Who:** The system encounters situations where AI must hand off to a human — fraud indicators, complex legal questions, or emotional distress.

**Opening Scene:** A lead in Nigeria asks Chioma about a property listed at ₦5M in Banana Island (market value: ₦500M+). This triggers the "property price significantly below market" escalation flag.

**Rising Action:** Chioma does not share any property details. Instead, she responds: "Thank you for your interest. Let me connect you with our agent directly for more details on this property." The system flags the lead as "escalated — potential fraud" with reason code, sends an immediate WhatsApp notification to the agent, and logs the escalation in the compliance audit trail.

**Resolution:** The agent reviews the flagged conversation, confirms it's a scam listing, and marks the lead as dead. The audit log preserves the full interaction for NDPR compliance. No sensitive property information was leaked.

### Journey Requirements Summary

These journeys reveal the following capability areas:
- **Tenant Provisioning:** Market-aware onboarding, configuration, agent profile setup
- **AI Conversation Engine:** Market-specific personas, language detection, qualification logic, escalation triggers
- **WhatsApp Integration:** Inbound/outbound messaging, media handling, 24-hour window management
- **Lead Management:** Ingestion, scoring, status tracking, market-specific fields
- **Calendar & Appointments:** Multi-provider support, timezone/cultural awareness, confirmation flow
- **Payment & Billing:** Market-routed subscription management, usage tracking
- **Compliance & Audit:** NDPR/RERA guardrails, audit trails, escalation logging
- **Dashboard & Analytics:** Lead views, conversation threads, performance metrics, team management

## Domain-Specific Requirements

### Compliance & Regulatory

**Nigeria — NDPR (Nigeria Data Protection Regulation):**
- Explicit opt-in consent required before WhatsApp/SMS communication
- Data residency: lead and conversation data stored in Africa-West region
- Right to deletion: complete data purge within 30 days of request
- Breach notification: 72 hours to NITDA (National Information Technology Development Agency)
- Consent records stored with timestamp and method of capture

**Dubai — RERA (Real Estate Regulatory Agency):**
- No misleading property information in AI-generated messages
- No guaranteed ROI statements — AI must use hedging language ("historically", "typically")
- No steering based on nationality (AI must not recommend areas based on buyer's nationality)
- All communications retained for 5-year audit trail
- Agent RERA license number displayed in all official communications
- Ejari tenancy contract registration compliance (when integration enabled)

**Dubai — DIFC (Dubai International Financial Centre) Data Protection:**
- Focus on informed consent for data processing
- Cross-border data transfer requires adequate protection
- Data processing records maintained

### Technical Constraints

- **Secret Management:** All API keys (Paystack, Stripe, WhatsApp, Claude) stored in Firebase Cloud Secret Manager — never in client-side code or Firestore documents
- **Tenant Isolation:** Firestore security rules enforce tenantId-scoped access — no query can return cross-tenant data
- **E.164 Phone Format:** All phone numbers stored in E.164 format (+234... for Nigeria, +971... for Dubai)
- **Currency Handling:** All monetary values stored in tenant's local currency (NGN or AED) with exchange rate snapshot for USD reporting

### Integration Requirements

| Integration | Nigeria | Dubai | Priority |
|------------|---------|-------|----------|
| WhatsApp Business API | Required | Required | MVP |
| Paystack | Required | N/A | MVP |
| Stripe | N/A | Required | MVP |
| Google Calendar | Required | Required | MVP |
| Outlook Calendar | Optional | Required | Growth |
| Claude API (Anthropic) | Required | Required | MVP |
| Property Finder API | N/A | Required | Growth |
| Bayut API | N/A | Optional | Growth |
| Nigerian Property Centre | Optional | N/A | Growth |
| Dubai REST API | N/A | Optional | Growth |
| CAC Lookup | Optional | N/A | Growth |
| Twilio Voice | Optional | N/A | Growth |
| Infobip Voice | N/A | Optional | Growth |

### Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp Business API rate limits | Delayed responses, poor UX | Message queuing with priority; utility vs marketing message type optimization |
| Claude API downtime | AI conversations halt | Fallback to template responses; queue messages for retry |
| Paystack/Stripe webhook failures | Missed payment events | Idempotent webhook handlers; manual reconciliation dashboard |
| RERA compliance violation | Legal liability, license revocation | Pre-send compliance checker on all AI outputs; blocked phrases list |
| NDPR data breach | Fines, trust loss | Encryption at rest/transit; audit logging; 72-hour response plan |
| Cross-tenant data leak | Trust destruction | Firestore security rules with automated testing; no admin SDK bypass in client |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Culturally Intelligent AI Personas:** Unlike generic chatbots, Chioma and Aisha embody deep cultural knowledge — understanding Pidgin English, Lagos traffic patterns, Ramadan sensitivity, and Dubai's multinational buyer dynamics. This is "Workflow automation + AI agents" innovation applied to a culturally specific context that no competitor addresses.

2. **WhatsApp-First Architecture for Enterprise SaaS:** Most SaaS platforms treat WhatsApp as a notification channel. AgentFlow AI treats it as the primary interaction surface — the AI qualification, appointment booking, and lead nurture all happen within WhatsApp conversations, matching how business is actually conducted in both markets.

3. **Market-as-Configuration Architecture:** Multi-market support without code forks. Adding a new market (Saudi Arabia, Kenya) requires a configuration document and AI persona prompt — not a new deployment or codebase branch.

### Validation Approach

- **Cultural AI accuracy:** Beta test with 5 agents per market; measure AI response appropriateness via agent ratings on each conversation
- **WhatsApp conversion rates:** A/B test AI-qualified leads vs manually qualified leads for appointment show rates
- **Market expansion speed:** Validate that adding a mock "Kenya" market takes < 1 day of configuration work

### Risk Mitigation

- **AI cultural insensitivity:** Human review of first 100 conversations per market; iterative prompt tuning; agent override capability
- **WhatsApp policy changes:** Abstract WhatsApp integration behind a messaging interface; future-proof for alternative channels
- **Market config complexity explosion:** Strict schema validation on market_config documents; automated integration tests per market

## SaaS B2B Specific Requirements

### Multi-Tenancy Architecture

- **Tenant isolation model:** Document-level isolation via `tenantId` field on all Firestore documents
- **Market field:** First-class `market` field ("nigeria" | "dubai") on every tenant — drives all market-specific behavior at runtime
- **Security rules:** Firestore rules enforce `request.auth.uid == resource.data.tenantId` pattern; no server-side bypasses
- **Configuration inheritance:** Market defaults loaded from `/market_config/{marketId}`, overridable at tenant level

### Subscription Tiers

| Tier | Nigeria (NGN/month) | Dubai (AED/month) | Leads/Month | Agents | Key Features |
|------|--------------------|--------------------|-------------|--------|-------------|
| Solo | ₦25,000 | AED 179 | 100 | 1 | AI qualification, WhatsApp, Calendar |
| Team | ₦75,000 | AED 499 | 500 | 5 | + Team dashboard, CRM integration |
| Brokerage | ₦200,000 | AED 1,299 | Unlimited | Unlimited | + Compliance reports, API access, white-label |

### Integration Architecture

- **WhatsApp Business API:** Single webhook endpoint handles both markets; message routing based on `phoneNumberId` → `tenantId` mapping
- **Payment routing:** `tenant.market` field determines Paystack (Nigeria) or Stripe (Dubai) at transaction time
- **Calendar sync:** Google Calendar as default; Outlook integration via Microsoft Graph API (Dubai priority)
- **CRM webhooks:** Outbound lead sync to configured CRM provider; normalized payload format regardless of target CRM

### Implementation Considerations

- **Firebase project:** Single project `agentflowai-11dd2` for MVP; regional projects for data residency in Vision phase
- **Cloud Functions:** Node.js/TypeScript; all functions read `tenant.market` at runtime — no market-specific function deployments
- **Frontend:** React SPA with market-aware components; dynamic form fields, currency display, and calendar rules based on tenant's market
- **AI model:** Claude API (latest model) with market-specific system prompts stored in tenant `aiConfig`

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — deliver the core value loop (lead in → AI qualifies → appointment booked) for both markets simultaneously. The "full version" scope means both Nigeria and Dubai ship together, but advanced integrations (government APIs, voice, CRM) defer to Growth phase.

**Resource Requirements:** 1 full-stack developer (React + Firebase), 1 AI/backend specialist (Claude integration + Cloud Functions), 1 product owner (joseph). Designer optional — Tailwind component library covers MVP UI needs.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Agent onboarding with market selection
- AI-powered lead qualification via WhatsApp (both markets)
- Appointment booking with Google Calendar
- Lead management dashboard
- Subscription billing

**Must-Have Capabilities:**
- Firebase Auth + Firestore tenant provisioning
- WhatsApp Business API send/receive
- Claude AI conversation with Chioma/Aisha system prompts
- Lead CRUD with market-specific fields
- Lead scoring (0-100) with qualification status
- Google Calendar appointment creation
- Paystack (Nigeria) and Stripe (Dubai) subscription checkout
- React dashboard: leads table, conversation viewer, calendar view
- Basic Firestore security rules
- NDPR consent capture; RERA compliance guardrails in AI prompts

### Post-MVP Features

**Phase 2 (Growth):**
- Property portal lead ingestion (Property Finder, Bayut, NPC)
- Outlook calendar integration
- CRM outbound sync
- Voice handling (Twilio/Infobip)
- Team management (multi-agent tenants)
- Advanced analytics with currency conversion
- WhatsApp template message builder
- Appointment reminders (24hr, 1hr)

**Phase 3 (Expansion):**
- Regional Firebase projects for data residency
- Global control plane
- Additional markets (Saudi Arabia, Kenya, Egypt)
- AI voice personas
- Government integrations (Dubai REST, Ejari, CAC)
- White-label brokerage option
- API marketplace

### Risk Mitigation Strategy

**Technical Risks:** WhatsApp Business API approval can take 2-4 weeks; start the application process immediately. Claude API rate limits may constrain concurrent conversations; implement request queuing with exponential backoff.

**Market Risks:** Real estate agents may resist AI handling their leads. Mitigation: position AI as assistant (not replacement), provide full conversation visibility, allow instant human takeover at any point.

**Resource Risks:** If constrained to single developer, prioritize Nigeria market first (simpler compliance), then add Dubai within 1-2 weeks. The market-agnostic architecture means Dubai is largely configuration.

## Functional Requirements

### Tenant Management

- FR1: Agent can sign up and select their market (Nigeria or Dubai) during onboarding
- FR2: System can provision a new tenant with market-specific defaults (currency, timezone, weekend days, compliance flags)
- FR3: Agent can configure their profile (name, email, phone, license number, brokerage, preferred language)
- FR4: Agent can configure AI persona settings (greeting script, qualification questions, handoff threshold)
- FR5: Agent can connect WhatsApp Business Account to their tenant
- FR6: Agent can connect Google Calendar to their tenant
- FR7: Agent can connect Outlook Calendar to their tenant (Dubai)
- FR8: Agent can configure payment integration (Paystack for Nigeria, Stripe for Dubai)
- FR9: Admin can invite and manage multiple agents within a tenant (Team/Brokerage tiers)
- FR10: System can enforce subscription tier limits (lead count, agent count, feature access)

### Lead Management

- FR11: System can ingest leads from WhatsApp conversations
- FR12: System can ingest leads from manual entry via dashboard
- FR13: System can ingest leads from external webhooks (Property Finder, Bayut, Nigerian Property Centre)
- FR14: System can normalize all lead data to a universal schema with market-specific extensions
- FR15: Agent can view all leads in a filterable, sortable table with market-appropriate fields
- FR16: Agent can view full conversation history for any lead
- FR17: Agent can manually update lead status, score, and qualification details
- FR18: System can assign lead qualification scores (0-100) based on AI conversation analysis
- FR19: System can classify lead urgency (hot/warm/cold) based on qualification criteria
- FR20: Agent can filter leads by status, urgency, source, property type, and budget range

### AI Conversation Engine

- FR21: System can initiate AI conversation with new leads using market-specific persona (Chioma or Aisha)
- FR22: AI can conduct multi-turn qualification conversations via WhatsApp
- FR23: AI can detect lead's preferred language and adapt communication style
- FR24: AI can ask market-specific qualification questions (Nigeria: title type, payment plan, land size; Dubai: off-plan, freehold, investment type, target yield)
- FR25: AI can detect escalation triggers and hand off to human agent (fraud indicators, legal complexity, compliance risks)
- FR26: AI can suggest appointment times based on calendar availability and market-specific constraints
- FR27: AI can generate conversation summaries with extracted entities (budget, timeline, preferences)
- FR28: Agent can take over any AI conversation at any point
- FR29: Agent can review AI-generated messages before sending (optional approval mode)
- FR30: System can apply compliance guardrails to all AI-generated messages (RERA: no ROI guarantees; Nigeria: fraud prevention)

### WhatsApp Integration

- FR31: System can receive inbound WhatsApp messages (text, voice, media) via Meta webhook
- FR32: System can send outbound WhatsApp messages (text, media, location) via Meta API
- FR33: System can verify WhatsApp webhook signatures for security
- FR34: System can track WhatsApp 24-hour free conversation windows per lead
- FR35: System can send WhatsApp template messages for outbound initiation
- FR36: System can process WhatsApp voice messages (transcription via Claude)
- FR37: System can handle WhatsApp media messages (property images, documents)
- FR38: System can log all WhatsApp message costs for usage tracking (differentiated by market pricing)

### Calendar & Appointments

- FR39: System can check agent availability across connected calendars (Google, Outlook)
- FR40: System can create calendar events with lead details, viewing type, and location
- FR41: System can block culturally sensitive times (Dubai: Friday 12-2 PM for Jumu'ah prayer)
- FR42: System can block public holidays (Nigeria: dynamic holiday lookup)
- FR43: System can send appointment confirmation via WhatsApp with localized formatting
- FR44: System can send appointment reminders (24hr, 1hr before) via WhatsApp
- FR45: Agent can view all appointments in a calendar interface on the dashboard
- FR46: Agent can reschedule or cancel appointments (triggers WhatsApp notification to lead)

### Payments & Billing

- FR47: System can initialize Paystack payment for Nigerian tenants (NGN, card, bank, USSD, mobile money)
- FR48: System can initialize Stripe payment for Dubai tenants (AED, card, Apple Pay, Google Pay)
- FR49: System can process subscription webhooks from Paystack and Stripe
- FR50: System can enforce subscription tier limits based on payment status
- FR51: System can send payment receipts via WhatsApp (localized currency format)
- FR52: Agent can view billing history and current subscription status on dashboard
- FR53: System can handle failed payments with retry logic and dunning notifications

### Compliance & Audit

- FR54: System can capture and store NDPR consent records with timestamp (Nigeria)
- FR55: System can execute data deletion requests within 30 days (NDPR right to deletion)
- FR56: System can apply RERA compliance checks to AI-generated messages before sending (Dubai)
- FR57: System can maintain 5-year audit trail of all communications (Dubai RERA requirement)
- FR58: System can flag and log compliance violations with reason codes
- FR59: System can generate compliance audit reports per tenant
- FR60: System can detect and flag suspicious patterns (fraud indicators per market)

### Dashboard & Analytics

- FR61: Agent can view a dashboard with lead pipeline overview, recent conversations, and upcoming appointments
- FR62: Agent can view real-time conversation threads with AI/human message differentiation
- FR63: Agent can view analytics: leads by source, conversion rates, response times, appointment rates
- FR64: Agent can view usage metrics: WhatsApp conversations, AI tokens consumed, appointments booked
- FR65: Admin can view team performance metrics across all agents in tenant (Team/Brokerage tiers)
- FR66: Agent can export lead data in CSV format
- FR67: Dashboard can display all monetary values in tenant's configured currency (NGN or AED)

## Non-Functional Requirements

### Performance

- All dashboard pages load within 2 seconds on a 4G connection
- WhatsApp webhook processing completes within 3 seconds of receipt
- Claude AI generates qualification responses within 5 seconds per conversation turn
- Firestore queries return lead lists within 500ms for up to 10,000 leads per tenant
- Cloud Functions cold start under 3 seconds; warm execution under 500ms

### Security

- All data encrypted at rest (Firestore default) and in transit (HTTPS/TLS 1.2+)
- All third-party API keys stored in Firebase Cloud Secret Manager — never in Firestore documents or client code
- Firebase Auth with email/password; OAuth optional for Google/Microsoft SSO
- Firestore security rules enforce tenant isolation — every query scoped to authenticated user's tenantId
- WhatsApp webhook signature verification on every inbound request
- Rate limiting on all public-facing Cloud Function endpoints (100 requests/minute per IP)
- CORS configured to allow only the AgentFlow AI frontend domain

### Scalability

- System supports 1,000 tenants with 100 concurrent WhatsApp conversations per tenant
- Firestore indexes optimized for common query patterns (leads by status, by date, by score)
- Cloud Functions auto-scale with Firebase's managed infrastructure
- WhatsApp message queue handles burst traffic (100 messages/second) with ordered processing
- Designed for horizontal scaling via additional Firebase projects per region (Vision phase)

### Reliability

- 99.9% uptime target leveraging Firebase's managed infrastructure SLA
- Idempotent webhook handlers for Paystack, Stripe, and WhatsApp (duplicate event tolerance)
- Failed AI responses trigger automatic retry (3 attempts with exponential backoff)
- Conversation state persisted in Firestore — no data loss on function restart
- Dead letter queue for failed message deliveries with admin notification

### Integration

- WhatsApp Business API: Meta Cloud API v18+ with webhook verification
- Claude API: Anthropic API with conversation threading (message history context)
- Paystack: REST API v2 with webhook for payment events
- Stripe: API v2023+ with Payment Intents and webhook for subscription lifecycle
- Google Calendar: Google Calendar API v3 with OAuth2 refresh tokens
- Microsoft Graph: Outlook Calendar API with OAuth2 refresh tokens
- All integrations implement circuit breaker pattern: 3 failures → 30-second cooldown → retry

---

*This PRD serves as the capability contract for all downstream work. UX design, architecture, epic breakdown, and development must trace back to the requirements documented here. Update this document as the product evolves.*
