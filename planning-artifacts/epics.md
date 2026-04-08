---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - planning-artifacts/prd.md
---

# AgentFlow AI - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AgentFlow AI, decomposing the 67 functional requirements from the PRD into implementable stories organized by user value delivery.

## Requirements Inventory

### Functional Requirements

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
- FR31: System can receive inbound WhatsApp messages (text, voice, media) via Meta webhook
- FR32: System can send outbound WhatsApp messages (text, media, location) via Meta API
- FR33: System can verify WhatsApp webhook signatures for security
- FR34: System can track WhatsApp 24-hour free conversation windows per lead
- FR35: System can send WhatsApp template messages for outbound initiation
- FR36: System can process WhatsApp voice messages (transcription via Claude)
- FR37: System can handle WhatsApp media messages (property images, documents)
- FR38: System can log all WhatsApp message costs for usage tracking (differentiated by market pricing)
- FR39: System can check agent availability across connected calendars (Google, Outlook)
- FR40: System can create calendar events with lead details, viewing type, and location
- FR41: System can block culturally sensitive times (Dubai: Friday 12-2 PM for Jumu'ah prayer)
- FR42: System can block public holidays (Nigeria: dynamic holiday lookup)
- FR43: System can send appointment confirmation via WhatsApp with localized formatting
- FR44: System can send appointment reminders (24hr, 1hr before) via WhatsApp
- FR45: Agent can view all appointments in a calendar interface on the dashboard
- FR46: Agent can reschedule or cancel appointments (triggers WhatsApp notification to lead)
- FR47: System can initialize Paystack payment for Nigerian tenants (NGN, card, bank, USSD, mobile money)
- FR48: System can initialize Stripe payment for Dubai tenants (AED, card, Apple Pay, Google Pay)
- FR49: System can process subscription webhooks from Paystack and Stripe
- FR50: System can enforce subscription tier limits based on payment status
- FR51: System can send payment receipts via WhatsApp (localized currency format)
- FR52: Agent can view billing history and current subscription status on dashboard
- FR53: System can handle failed payments with retry logic and dunning notifications
- FR54: System can capture and store NDPR consent records with timestamp (Nigeria)
- FR55: System can execute data deletion requests within 30 days (NDPR right to deletion)
- FR56: System can apply RERA compliance checks to AI-generated messages before sending (Dubai)
- FR57: System can maintain 5-year audit trail of all communications (Dubai RERA requirement)
- FR58: System can flag and log compliance violations with reason codes
- FR59: System can generate compliance audit reports per tenant
- FR60: System can detect and flag suspicious patterns (fraud indicators per market)
- FR61: Agent can view a dashboard with lead pipeline overview, recent conversations, and upcoming appointments
- FR62: Agent can view real-time conversation threads with AI/human message differentiation
- FR63: Agent can view analytics: leads by source, conversion rates, response times, appointment rates
- FR64: Agent can view usage metrics: WhatsApp conversations, AI tokens consumed, appointments booked
- FR65: Admin can view team performance metrics across all agents in tenant (Team/Brokerage tiers)
- FR66: Agent can export lead data in CSV format
- FR67: Dashboard can display all monetary values in tenant's configured currency (NGN or AED)

### NonFunctional Requirements

- NFR1: All dashboard pages load within 2 seconds on a 4G connection
- NFR2: WhatsApp webhook processing completes within 3 seconds of receipt
- NFR3: Claude AI generates qualification responses within 5 seconds per conversation turn
- NFR4: Firestore queries return lead lists within 500ms for up to 10,000 leads per tenant
- NFR5: Cloud Functions cold start under 3 seconds; warm execution under 500ms
- NFR6: All data encrypted at rest (Firestore default) and in transit (HTTPS/TLS 1.2+)
- NFR7: All third-party API keys stored in Firebase Cloud Secret Manager
- NFR8: Firebase Auth with email/password; OAuth optional for Google/Microsoft SSO
- NFR9: Firestore security rules enforce tenant isolation — every query scoped to authenticated user's tenantId
- NFR10: WhatsApp webhook signature verification on every inbound request
- NFR11: Rate limiting on all public-facing Cloud Function endpoints (100 requests/minute per IP)
- NFR12: CORS configured to allow only the AgentFlow AI frontend domain
- NFR13: System supports 1,000 tenants with 100 concurrent WhatsApp conversations per tenant
- NFR14: Firestore indexes optimized for common query patterns
- NFR15: WhatsApp message queue handles burst traffic (100 messages/second) with ordered processing
- NFR16: 99.9% uptime target leveraging Firebase's managed infrastructure SLA
- NFR17: Idempotent webhook handlers for Paystack, Stripe, and WhatsApp
- NFR18: Failed AI responses trigger automatic retry (3 attempts with exponential backoff)
- NFR19: Conversation state persisted in Firestore — no data loss on function restart
- NFR20: Dead letter queue for failed message deliveries with admin notification
- NFR21: All integrations implement circuit breaker pattern: 3 failures → 30-second cooldown → retry

### Additional Requirements

- Firebase project `agentflowai-11dd2` as single deployment target for MVP
- Node.js/TypeScript for Cloud Functions
- React + TypeScript + Tailwind CSS for frontend
- Single-project Firebase deployment (regional projects deferred to Vision phase)
- Cloud Secret Manager for all API keys
- Firestore security rules with automated testing

### UX Design Requirements

No UX Design document was provided. UX will be addressed inline within each story's acceptance criteria using Tailwind CSS component patterns.

### FR Coverage Map

- FR1: Epic 1 — Agent signup with market selection
- FR2: Epic 1 — Tenant provisioning with market defaults
- FR3: Epic 1 — Agent profile configuration
- FR4: Epic 1 — AI persona settings
- FR5: Epic 2 — WhatsApp Business Account connection
- FR6: Epic 5 — Google Calendar connection
- FR7: Epic 5 — Outlook Calendar connection
- FR8: Epic 6 — Payment integration setup
- FR9: Epic 8 — Team management
- FR10: Epic 6 — Subscription tier enforcement
- FR11: Epic 3 — Lead ingestion from WhatsApp
- FR12: Epic 4 — Manual lead entry
- FR13: Epic 9 — External webhook lead ingestion
- FR14: Epic 3 — Lead data normalization
- FR15: Epic 4 — Lead table with filters
- FR16: Epic 4 — Conversation history view
- FR17: Epic 4 — Manual lead updates
- FR18: Epic 3 — AI lead scoring
- FR19: Epic 3 — Lead urgency classification
- FR20: Epic 4 — Lead filtering
- FR21: Epic 3 — AI conversation initiation
- FR22: Epic 3 — Multi-turn AI conversations
- FR23: Epic 3 — Language detection
- FR24: Epic 3 — Market-specific qualification
- FR25: Epic 3 — Escalation triggers
- FR26: Epic 5 — AI appointment suggestions
- FR27: Epic 3 — Conversation summaries
- FR28: Epic 4 — Agent conversation takeover
- FR29: Epic 4 — AI message approval mode
- FR30: Epic 3 — Compliance guardrails
- FR31: Epic 2 — Inbound WhatsApp messages
- FR32: Epic 2 — Outbound WhatsApp messages
- FR33: Epic 2 — Webhook signature verification
- FR34: Epic 2 — 24-hour window tracking
- FR35: Epic 2 — Template messages
- FR36: Epic 2 — Voice message processing
- FR37: Epic 2 — Media message handling
- FR38: Epic 2 — Message cost logging
- FR39: Epic 5 — Calendar availability check
- FR40: Epic 5 — Calendar event creation
- FR41: Epic 5 — Cultural time blocking
- FR42: Epic 5 — Public holiday blocking
- FR43: Epic 5 — Appointment confirmation via WhatsApp
- FR44: Epic 5 — Appointment reminders
- FR45: Epic 5 — Calendar interface on dashboard
- FR46: Epic 5 — Reschedule/cancel appointments
- FR47: Epic 6 — Paystack payment initialization
- FR48: Epic 6 — Stripe payment initialization
- FR49: Epic 6 — Subscription webhook processing
- FR50: Epic 6 — Tier limit enforcement
- FR51: Epic 6 — Payment receipts via WhatsApp
- FR52: Epic 6 — Billing dashboard
- FR53: Epic 6 — Failed payment handling
- FR54: Epic 7 — NDPR consent capture
- FR55: Epic 7 — Data deletion requests
- FR56: Epic 7 — RERA compliance checks
- FR57: Epic 7 — 5-year audit trail
- FR58: Epic 7 — Compliance violation flagging
- FR59: Epic 7 — Compliance audit reports
- FR60: Epic 7 — Fraud pattern detection
- FR61: Epic 4 — Dashboard overview
- FR62: Epic 4 — Conversation thread view
- FR63: Epic 8 — Analytics views
- FR64: Epic 8 — Usage metrics
- FR65: Epic 8 — Team performance metrics
- FR66: Epic 8 — Lead data export
- FR67: Epic 4 — Currency display

## Epic List

### Epic 1: Project Foundation & Agent Onboarding
Agents can sign up, select their market (Nigeria/Dubai), configure their profile, and have a fully provisioned tenant with market-specific defaults ready for use.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: WhatsApp Messaging Pipeline
Agents can connect their WhatsApp Business Account and the platform can send/receive messages with full webhook security, media handling, and cost tracking.
**FRs covered:** FR5, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

### Epic 3: AI-Powered Lead Qualification
AI personas (Chioma/Aisha) can qualify leads through intelligent multi-turn WhatsApp conversations with market-specific questions, language detection, scoring, and compliance guardrails.
**FRs covered:** FR11, FR14, FR18, FR19, FR21, FR22, FR23, FR24, FR25, FR27, FR30

### Epic 4: Lead Management Dashboard
Agents can view, manage, filter, and interact with their lead pipeline from a comprehensive dashboard with conversation views and manual controls.
**FRs covered:** FR12, FR15, FR16, FR17, FR20, FR28, FR29, FR61, FR62, FR67

### Epic 5: Calendar & Appointment Booking
AI can suggest and book appointments respecting cultural constraints, agents can manage their calendar, and leads receive WhatsApp confirmations and reminders.
**FRs covered:** FR6, FR7, FR26, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46

### Epic 6: Payments & Subscription Billing
Agents can subscribe via market-appropriate payment providers (Paystack/Stripe), manage billing, and the system enforces tier limits.
**FRs covered:** FR8, FR10, FR47, FR48, FR49, FR50, FR51, FR52, FR53

### Epic 7: Compliance & Audit System
Platform enforces NDPR (Nigeria) and RERA (Dubai) regulations with consent capture, audit trails, compliance checks, fraud detection, and reporting.
**FRs covered:** FR54, FR55, FR56, FR57, FR58, FR59, FR60

### Epic 8: Analytics, Reporting & Team Management
Agents can view performance analytics and usage metrics; admins can manage teams and view cross-agent performance.
**FRs covered:** FR9, FR63, FR64, FR65, FR66

### Epic 9: External Lead Sources
System can ingest leads from property portals (Property Finder, Bayut, Nigerian Property Centre) via webhooks.
**FRs covered:** FR13

---

## Epic 1: Project Foundation & Agent Onboarding

Agents can sign up, select their market, configure their profile, and have a fully provisioned tenant with market-specific defaults. This epic establishes the Firebase project structure, authentication, Firestore data model, and onboarding flow that all subsequent epics build upon.

### Story 1.1: Firebase Project Setup & Core Infrastructure

As a developer,
I want to initialize the Firebase project with Auth, Firestore, Cloud Functions, and Hosting,
So that we have a working foundation to build all features upon.

**Acceptance Criteria:**

**Given** the Firebase project `agentflowai-11dd2` exists
**When** the project is initialized
**Then** Firebase Auth (email/password) is configured
**And** Firestore is initialized with security rules enforcing `request.auth != null`
**And** Cloud Functions (Node.js/TypeScript) scaffold is deployed
**And** Firebase Hosting serves the React app shell
**And** Cloud Secret Manager is configured for API key storage
**And** CORS is configured to allow only the AgentFlow AI frontend domain
**And** the `/market_config/nigeria` and `/market_config/dubai` documents are seeded with default configuration (currency, timezone, weekend, compliance flags, subscription tiers)

### Story 1.2: Agent Signup with Market Selection

As a real estate agent,
I want to sign up and select my market (Nigeria or Dubai),
So that my account is configured for my specific market from the start.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter my email, password, and select "Nigeria" or "Dubai" as my market
**Then** a Firebase Auth account is created
**And** a `/tenants/{uid}` document is created in Firestore with:
  - `market`: selected market value
  - `region`: "africa-west" (Nigeria) or "mena" (Dubai)
  - `status`: "trial"
  - `config`: loaded from `/market_config/{market}` defaults (currency, timezone, weekend, dateFormat, compliance flags)
  - `createdAt`: server timestamp
**And** I am redirected to the profile setup page
**And** Firestore security rules enforce that I can only read/write my own tenant document

### Story 1.3: Agent Profile Configuration

As a real estate agent,
I want to configure my professional profile,
So that the AI assistant and system have my details for personalized interactions.

**Acceptance Criteria:**

**Given** I am logged in and on the profile setup page
**When** I enter my name, phone (validated E.164 format), license number, brokerage name, and preferred language
**Then** the `agent` field on my `/tenants/{uid}` document is updated
**And** phone number is validated: +234 prefix for Nigeria, +971 prefix for Dubai
**And** preferred language options are: "en" for both markets, plus "en-ng" (Nigeria), "en-ae" or "ar" (Dubai)
**And** I can update these fields later from the settings page
**And** license number field label shows "RERA License" for Dubai and "State License" for Nigeria

### Story 1.4: AI Persona Configuration

As a real estate agent,
I want to configure my AI assistant's behavior,
So that the AI matches my business style and market needs.

**Acceptance Criteria:**

**Given** I am logged in and on the AI settings page
**When** I configure the AI persona settings
**Then** I can set/edit: persona name (defaults to "Chioma" for Nigeria, "Aisha" for Dubai), greeting script, handoff threshold (score 0-100), and qualification question priorities
**And** the `aiConfig` field on my tenant document is updated with these settings
**And** market-specific feature flags are auto-set: offPlanSupport (Dubai: true), rentalYieldCalc (Dubai: true), mobileMoney (Nigeria: true), ejariIntegration (Dubai: true)
**And** I can preview the greeting message as it would appear in WhatsApp
**And** default qualification questions are pre-populated based on market

---

## Epic 2: WhatsApp Messaging Pipeline

The platform can send and receive WhatsApp messages through the Meta Business API with full security, media handling, conversation window tracking, and cost logging. This epic establishes the messaging infrastructure all AI conversations depend on.

### Story 2.1: WhatsApp Business Account Connection

As a real estate agent,
I want to connect my WhatsApp Business Account to AgentFlow AI,
So that the platform can send and receive messages on my behalf.

**Acceptance Criteria:**

**Given** I am logged in and on the integrations settings page
**When** I enter my WhatsApp Phone Number ID and WABA ID
**Then** the `integrations.whatsapp` field on my tenant document is updated with `enabled: true`, `phoneNumberId`, and `wabaId`
**And** the system creates a mapping record from `phoneNumberId` → `tenantId` for webhook routing
**And** a test message can be sent to verify the connection
**And** connection status is displayed (connected/disconnected) on the settings page

### Story 2.2: WhatsApp Webhook Receiver with Signature Verification

As the system,
I want to receive inbound WhatsApp messages via a secure webhook,
So that lead messages are captured and routed to the correct tenant.

**Acceptance Criteria:**

**Given** Meta sends a webhook POST to `/webhook/whatsapp`
**When** the Cloud Function receives the request
**Then** the `X-Hub-Signature-256` header is verified against the app secret
**And** if verification fails, the request is rejected with 403
**And** if verification passes, the message payload is parsed (text, voice, media, location)
**And** the `phoneNumberId` from the payload is used to look up the `tenantId`
**And** a `/leads/{leadId}/messages/{messageId}` document is created with: type "inbound", channel "whatsapp", content (text/audioUrl/mediaUrl), timestamp
**And** the webhook responds with 200 within 3 seconds (NFR2)

### Story 2.3: Outbound WhatsApp Message Sending

As the system,
I want to send WhatsApp messages to leads,
So that the AI assistant and agent can communicate with leads through WhatsApp.

**Acceptance Criteria:**

**Given** a message needs to be sent to a lead's WhatsApp number
**When** the send function is called with tenantId, leadId, and message content
**Then** the tenant's WhatsApp credentials are fetched from Firestore
**And** the message is sent via Meta Cloud API `/messages` endpoint
**And** the response status is recorded
**And** a `/leads/{leadId}/messages/{messageId}` document is created with: type "outbound", channel "whatsapp", content, metadata (aiGenerated boolean)
**And** message supports text, media (images/documents), and location types
**And** failed sends are retried 3 times with exponential backoff (NFR18)

### Story 2.4: 24-Hour Conversation Window Tracking

As the system,
I want to track WhatsApp's 24-hour free conversation window per lead,
So that we use template messages when outside the free window and optimize messaging costs.

**Acceptance Criteria:**

**Given** a lead has sent an inbound message
**When** the message is received
**Then** the `conversation.lastMessageAt` timestamp on the lead document is updated
**And** the system calculates whether we are within the 24-hour free window
**And** if within the window, free-form messages can be sent
**And** if outside the window, only approved template messages can be sent (FR35)
**And** the window status is visible when viewing the lead's conversation

### Story 2.5: WhatsApp Template Message Support

As a real estate agent,
I want to send template messages to initiate conversations with leads,
So that I can reach out to leads outside the 24-hour free window.

**Acceptance Criteria:**

**Given** a lead's 24-hour conversation window has expired
**When** the agent or AI needs to send a message
**Then** the system uses pre-approved WhatsApp template messages
**And** template messages are stored in the tenant's configuration
**And** template variables (lead name, agent name, property details) are populated dynamically
**And** the template message is sent via Meta API with `type: template`
**And** cost is logged as "marketing" rate (higher tier pricing)

### Story 2.6: Voice Message Transcription

As the system,
I want to transcribe WhatsApp voice messages,
So that the AI can process and respond to voice-based lead communications.

**Acceptance Criteria:**

**Given** an inbound WhatsApp message contains audio/voice content
**When** the message is processed
**Then** the audio URL is downloaded from Meta's media endpoint
**And** the audio is sent to Claude API for transcription
**And** the transcribed text is stored in `content.text` alongside `content.audioUrl`
**And** the AI conversation continues using the transcribed text
**And** the original voice message remains accessible in the conversation view

### Story 2.7: Media Message Handling

As the system,
I want to handle WhatsApp media messages (images, documents),
So that leads can share property photos and documents through the conversation.

**Acceptance Criteria:**

**Given** an inbound or outbound WhatsApp message contains media (image, document, video)
**When** the message is processed
**Then** the media URL is extracted and stored in `content.mediaUrl`
**And** media type is identified (image, document, video)
**And** inbound media URLs are stored with reference to the lead conversation
**And** outbound media can be sent via Meta API with `type: image` or `type: document`
**And** media is displayed in the conversation view on the dashboard

### Story 2.8: WhatsApp Message Cost Tracking

As the system,
I want to log the cost of each WhatsApp message by market,
So that usage can be tracked for billing and analytics.

**Acceptance Criteria:**

**Given** a WhatsApp message is sent or received
**When** the message event is processed
**Then** a cost entry is logged in `/usage_logs/{logId}` with: tenantId, market, date, message type (utility/marketing)
**And** Nigeria utility rate: $0.0067/msg; marketing rate: $0.0516/msg
**And** UAE utility rate: $0.0107/msg; marketing rate: $0.0455/msg
**And** the tenant's `usage.whatsappConversations` counter is incremented
**And** cost data is aggregated daily for the usage dashboard

---

## Epic 3: AI-Powered Lead Qualification

AI personas (Chioma for Nigeria, Aisha for Dubai) can qualify leads through intelligent multi-turn WhatsApp conversations. The AI asks market-specific questions, detects language, scores leads, handles escalations, and applies compliance guardrails — all automatically when a new lead message arrives.

### Story 3.1: Lead Creation from WhatsApp & Data Normalization

As the system,
I want to create a lead record when a new WhatsApp contact messages the agent,
So that every potential client is captured and tracked in the system.

**Acceptance Criteria:**

**Given** an inbound WhatsApp message arrives from a phone number not associated with an existing lead
**When** the webhook processor runs
**Then** a new `/leads/{leadId}` document is created with: tenantId, market (from tenant), source "whatsapp", contact.phone (E.164), contact.name (from WhatsApp profile if available)
**And** the `propertyInterest` object includes universal fields (budgetMin, budgetMax, timeline, propertyType, desiredAreas)
**And** market-specific extensions are initialized: `dubaiSpecific` (offPlan, handoverDate, freehold, investmentType, targetYield) for Dubai; `nigeriaSpecific` (landSize, titleType, infrastructureNeeds, paymentPlan) for Nigeria
**And** qualification is initialized: score 0, status "new", urgency "cold"
**And** conversation.threadId, conversation.channel "whatsapp", conversation.lastMessageAt are set
**And** if the phone number matches an existing lead, the message is appended to the existing conversation

### Story 3.2: AI Conversation Initiation with Market Persona

As the system,
I want to initiate an AI conversation when a new lead is created,
So that every lead receives an immediate, personalized qualification response.

**Acceptance Criteria:**

**Given** a new lead document is created in Firestore (onCreate trigger)
**When** the AI conversation orchestrator Cloud Function fires
**Then** the tenant's `aiConfig` is fetched (persona name, greeting script, qualification questions, languages, features)
**And** a Claude API conversation is initialized with the market-specific system prompt:
  - Nigeria: Chioma persona with Pidgin understanding, Lagos area knowledge, payment plan awareness
  - Dubai: Aisha persona with multicultural sensitivity, freehold/off-plan knowledge, RERA compliance
**And** the system prompt includes: agent name, brokerage, license number, market context (currency, areas, regulations)
**And** the initial greeting message is generated and sent via WhatsApp
**And** the Claude conversation thread ID is stored in `lead.conversation.threadId`
**And** response generation completes within 5 seconds (NFR3)

### Story 3.3: Multi-Turn AI Qualification Conversations

As the AI assistant,
I want to conduct multi-turn qualification conversations with leads,
So that leads are thoroughly qualified through natural conversation.

**Acceptance Criteria:**

**Given** a lead sends a WhatsApp message and an AI conversation thread exists
**When** the message is routed to the AI conversation handler
**Then** the full conversation history is loaded from `/leads/{leadId}/messages/`
**And** the message is sent to Claude API with the conversation context
**And** Claude generates a response that continues the qualification flow
**And** the AI response is sent back via WhatsApp
**And** both inbound and outbound messages are stored with `metadata.aiGenerated: true` on AI messages
**And** `metadata.tokensUsed` is recorded for each AI interaction
**And** the conversation continues until qualification is complete or escalation is triggered

### Story 3.4: Market-Specific Qualification Questions

As the AI assistant,
I want to ask qualification questions specific to the lead's market,
So that leads are qualified with relevant criteria for Nigeria or Dubai real estate.

**Acceptance Criteria:**

**Given** the AI is conducting a qualification conversation
**When** generating questions based on the tenant's market
**Then** for Nigeria, the AI asks about: budget in NGN, payment preference (outright/installment/mortgage), property type, desired areas (Lekki, Ikoyi, VI, Abuja phases), title type preference (C of O, Governor's Consent, Deed, Survey Plan), infrastructure needs (road, water, electricity, security), land size (plots/acres)
**And** for Dubai, the AI asks about: budget in AED, property type, desired areas (Dubai Marina, Downtown, Palm Jumeirah, JVC, Arabian Ranches), off-plan vs ready, freehold preference, investment type (primary residence/investment/holiday home), target rental yield, handover timeline, Islamic finance interest
**And** questions are asked conversationally, not as a rigid form
**And** the AI adapts question order based on lead responses

### Story 3.5: Language Detection & Adaptation

As the AI assistant,
I want to detect the lead's preferred language and adapt my communication style,
So that leads are communicated with in the language they're most comfortable with.

**Acceptance Criteria:**

**Given** a lead sends a message in any supported language
**When** the AI processes the message
**Then** the language is detected (Claude handles this natively)
**And** `conversation.languageDetected` is updated on the lead document
**And** for Nigeria: the AI understands Pidgin English and responds appropriately while maintaining professionalism
**And** for Dubai: the AI can handle basic Arabic greetings and real estate terms while defaulting to English
**And** `contact.preferredLanguage` is updated based on detected language patterns
**And** `metadata.languageConfidence` is recorded on each message

### Story 3.6: Lead Scoring & Urgency Classification

As the system,
I want to score leads (0-100) and classify urgency based on AI conversation analysis,
So that agents can prioritize their hottest leads.

**Acceptance Criteria:**

**Given** an AI conversation has progressed through qualification questions
**When** the AI generates each response
**Then** the AI extracts qualification signals and updates the lead's score (0-100)
**And** scoring factors include: budget confirmed (0-20), timeline clarity (0-20), property type specified (0-15), area preferences given (0-15), payment readiness (0-15), engagement level (0-15)
**And** urgency is classified: hot (score >= 70), warm (score 40-69), cold (score < 40)
**And** `qualification.score`, `qualification.status`, and `qualification.urgency` are updated on the lead document
**And** status progresses: new → contacted → qualified (score >= 40) → appointment_set (when booked)

### Story 3.7: AI Conversation Summaries & Entity Extraction

As the AI assistant,
I want to generate conversation summaries with extracted entities,
So that agents get a quick overview of each lead's needs without reading the full conversation.

**Acceptance Criteria:**

**Given** an AI conversation has collected qualification data
**When** the AI processes responses
**Then** entities are extracted and stored in `messages.metadata.entities`: budget range, timeline, property type, desired areas, specific requirements
**And** the `propertyInterest` fields on the lead document are populated from extracted entities
**And** a conversation summary is generated and stored, including: key requirements, qualification assessment, recommended next steps
**And** the summary updates as the conversation progresses
**And** the summary is visible on the lead detail view in the dashboard

### Story 3.8: Escalation Triggers & Human Handoff

As the AI assistant,
I want to detect escalation triggers and hand off to the human agent,
So that sensitive situations are handled by a human rather than AI.

**Acceptance Criteria:**

**Given** the AI is conducting a conversation
**When** the AI detects an escalation trigger
**Then** for Nigeria: triggers include "urgent sale"/"distress sale" (fraud), commission requests upfront (scam), personal bank detail requests, property price significantly below market
**And** for Dubai: triggers include guaranteed ROI requests (RERA violation), "cheap"/"hidden" area requests (steering), visa/tenant issues (legal complexity), unqualified meeting requests
**And** the AI sends a polite handoff message: "Let me connect you with [agent name] directly for this."
**And** the lead status is updated to include escalation reason code
**And** the agent receives an immediate WhatsApp notification about the escalation
**And** `qualification.readiness.agentReady` is set to true
**And** the escalation is logged in the compliance audit trail

### Story 3.9: Compliance Guardrails on AI Messages

As the system,
I want to apply compliance guardrails to all AI-generated messages before sending,
So that no message violates RERA (Dubai) or fraud prevention (Nigeria) rules.

**Acceptance Criteria:**

**Given** the AI has generated a response message
**When** the message is about to be sent
**Then** for Dubai: the message is checked for guaranteed ROI language, specific return promises, nationality-based area steering; blocked phrases trigger message rewrite
**And** for Nigeria: the message is checked for premature sharing of sensitive property details before trust is established, personal banking information
**And** `metadata.complianceCheck` is set to "passed", "flagged", or "blocked" on each message
**And** "blocked" messages are rewritten by the AI with compliant language and re-checked
**And** "flagged" messages are sent but logged for human review
**And** all compliance check results are stored for audit purposes

---

## Epic 4: Lead Management Dashboard

Agents can view, manage, filter, and interact with their lead pipeline from a comprehensive React dashboard. This includes manual lead entry, conversation views, lead editing, and agent takeover of AI conversations.

### Story 4.1: Dashboard Layout & Lead Pipeline Overview

As a real estate agent,
I want to see a dashboard with my lead pipeline overview, recent conversations, and upcoming appointments,
So that I have a complete picture of my business at a glance.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to the dashboard
**Then** I see a pipeline summary: count of leads by status (new, contacted, qualified, appointment_set, closed, dead)
**And** I see a count of leads by urgency (hot, warm, cold) with visual indicators
**And** I see the 5 most recent conversation activities
**And** I see the next 5 upcoming appointments
**And** all monetary values display in my tenant's configured currency (NGN or AED) (FR67)
**And** the page loads within 2 seconds on 4G (NFR1)

### Story 4.2: Lead List with Filtering & Sorting

As a real estate agent,
I want to view all my leads in a filterable, sortable table,
So that I can find and prioritize specific leads quickly.

**Acceptance Criteria:**

**Given** I am on the leads page
**When** the page loads
**Then** I see a table of all leads with columns: name, phone, status, urgency, score, source, property type, budget, last activity
**And** I can sort by any column
**And** I can filter by: status (multi-select), urgency (hot/warm/cold), source, property type, budget range (min/max in tenant currency)
**And** for Nigeria: additional filter for title type and payment plan
**And** for Dubai: additional filter for off-plan/ready and freehold/leasehold
**And** Firestore queries return results within 500ms (NFR4)
**And** filters persist across page navigation within the session

### Story 4.3: Manual Lead Entry

As a real estate agent,
I want to add leads manually from the dashboard,
So that I can track leads from phone calls, referrals, or in-person meetings.

**Acceptance Criteria:**

**Given** I am on the leads page
**When** I click "Add Lead" and fill in the form
**Then** I can enter: name, phone (validated E.164), email, source (referral/manual/other), preferred language
**And** I can enter property interest: type, budget range, timeline, desired areas
**And** for Nigeria: land size, title type, infrastructure needs, payment plan
**And** for Dubai: off-plan preference, freehold preference, investment type, target yield
**And** the lead is created in Firestore with status "new", score 0, urgency "cold"
**And** the market field is set from my tenant's market
**And** optionally, I can trigger AI to send the initial WhatsApp greeting to this lead

### Story 4.4: Conversation History View

As a real estate agent,
I want to view the full conversation history for any lead,
So that I can understand the context before engaging with the lead.

**Acceptance Criteria:**

**Given** I select a lead from the leads table
**When** the lead detail page opens
**Then** I see all messages in chronological order with: sender (AI/lead/agent), timestamp, message content (text, media thumbnails, voice message indicator)
**And** AI-generated messages are visually differentiated from human messages (FR62)
**And** the conversation summary and extracted entities are displayed in a sidebar
**And** the lead's qualification score, status, and urgency are prominently displayed
**And** the lead's property interest details are shown
**And** real-time updates appear when new messages arrive (Firestore onSnapshot)

### Story 4.5: Manual Lead Updates

As a real estate agent,
I want to manually update a lead's status, score, and qualification details,
So that I can override AI assessments based on my judgment.

**Acceptance Criteria:**

**Given** I am viewing a lead's detail page
**When** I edit the lead's information
**Then** I can update: status (from dropdown), score (0-100 slider), urgency (hot/warm/cold), notes
**And** I can update property interest fields
**And** I can mark a lead as "dead" with a reason
**And** changes are saved to Firestore with `updatedAt` timestamp
**And** a system message is logged in the conversation: "Agent updated lead status to [status]"

### Story 4.6: Agent Conversation Takeover

As a real estate agent,
I want to take over any AI conversation at any point,
So that I can personally handle complex or high-value leads.

**Acceptance Criteria:**

**Given** I am viewing an active AI conversation
**When** I click "Take Over Conversation"
**Then** AI auto-responses are paused for this lead
**And** I can type and send messages directly through the WhatsApp integration
**And** my messages are marked as `metadata.aiGenerated: false` in the message log
**And** a system message logs: "Agent took over conversation"
**And** I can click "Resume AI" to re-enable AI auto-responses
**And** the AI picks up context from where the human conversation left off

### Story 4.7: AI Message Approval Mode

As a real estate agent,
I want to optionally review AI-generated messages before they are sent,
So that I can maintain quality control over my client communications.

**Acceptance Criteria:**

**Given** I have enabled "approval mode" in my AI settings
**When** the AI generates a response to a lead
**Then** the message is held in a "pending approval" state instead of being sent
**And** I see a notification on the dashboard with the pending message
**And** I can approve (send as-is), edit then approve, or reject the message
**And** rejected messages prompt the AI to generate an alternative
**And** approval mode can be enabled/disabled per tenant in settings
**And** when disabled, AI messages send automatically (default behavior)

---

## Epic 5: Calendar & Appointment Booking

AI can suggest appointment times based on agent availability and cultural constraints, create calendar events, and send WhatsApp confirmations and reminders to leads. Agents manage appointments through a calendar interface.

### Story 5.1: Google Calendar Connection via OAuth

As a real estate agent,
I want to connect my Google Calendar to AgentFlow AI,
So that the AI can check my availability and book appointments.

**Acceptance Criteria:**

**Given** I am on the integrations settings page
**When** I click "Connect Google Calendar"
**Then** I am redirected to Google OAuth2 consent screen
**And** upon authorization, the refresh token is securely stored in my tenant's `integrations.calendar.google`
**And** the connection status shows "Connected" with the associated email
**And** I can disconnect at any time
**And** the refresh token is stored encrypted in Firestore (not in client code)

### Story 5.2: Outlook Calendar Connection via Microsoft Graph

As a real estate agent (Dubai priority),
I want to connect my Outlook Calendar to AgentFlow AI,
So that the AI can check my Outlook availability and book appointments there.

**Acceptance Criteria:**

**Given** I am on the integrations settings page
**When** I click "Connect Outlook Calendar"
**Then** I am redirected to Microsoft OAuth2 consent screen
**And** upon authorization, the refresh token is stored in `integrations.calendar.outlook`
**And** the connection status shows "Connected"
**And** if both Google and Outlook are connected, the system checks both for availability
**And** the agent can set a preferred calendar for new events

### Story 5.3: Calendar Availability Check with Cultural Constraints

As the system,
I want to check agent availability while respecting cultural time constraints,
So that appointments are never suggested during inappropriate times.

**Acceptance Criteria:**

**Given** the AI or system needs to find available appointment slots
**When** the availability check runs
**Then** free/busy data is fetched from all connected calendars (Google and/or Outlook)
**And** for Dubai: Friday 12:00-14:00 is always blocked (Jumu'ah prayer) (FR41)
**And** for Nigeria: known public holidays are blocked (dynamic lookup) (FR42)
**And** the Dubai weekend (Friday-Saturday) is respected for scheduling preferences
**And** the Nigeria weekend (Saturday-Sunday) is respected
**And** available slots are returned in the tenant's configured timezone

### Story 5.4: AI Appointment Suggestion During Conversation

As the AI assistant,
I want to suggest available appointment times during qualification conversations,
So that qualified leads can book viewings seamlessly within the chat.

**Acceptance Criteria:**

**Given** the AI has qualified a lead to score >= 60 (or tenant's handoff threshold)
**When** the lead expresses interest in viewing a property
**Then** the AI checks agent availability via the calendar integration
**And** suggests 2-3 available time slots with market-appropriate context:
  - Nigeria: "Is Saturday 10 AM good? That way we avoid the Third Mainland rush"
  - Dubai: avoids Friday 12-2 PM, offers video call option for international buyers
**And** when the lead selects a time, the appointment is created
**And** the conversation flow handles rescheduling if suggested times don't work

### Story 5.5: Calendar Event Creation with Lead Details

As the system,
I want to create calendar events with complete lead details,
So that agents have all context when they walk into a viewing.

**Acceptance Criteria:**

**Given** an appointment time has been confirmed (by AI conversation or manual booking)
**When** the event creation function runs
**Then** a calendar event is created on the agent's preferred calendar (Google or Outlook)
**And** the event title includes: "[AgentFlow] Viewing - {lead name}"
**And** the event description includes: lead name, phone, budget, property preferences, qualification score, AI conversation summary
**And** the event includes the property address or meeting location
**And** an `/appointments/{appointmentId}` document is created in Firestore with: tenantId, market, leadId, scheduledAt, duration (default 60 min), status "scheduled", type (property_viewing, buyer_consultation, etc.)
**And** the lead's `appointment` field and status "appointment_set" are updated

### Story 5.6: Appointment Confirmation via WhatsApp

As the system,
I want to send appointment confirmations to leads via WhatsApp,
So that leads have a clear record of their appointment details.

**Acceptance Criteria:**

**Given** an appointment has been created
**When** the confirmation flow runs
**Then** a WhatsApp message is sent to the lead with: date/time (in tenant's timezone and date format), appointment type, location/address, agent name and phone number
**And** for Nigeria: time is formatted with traffic advisory if relevant
**And** for Dubai: message includes any required documents (passport, Emirates ID)
**And** the confirmation message is logged in the conversation history
**And** the appointment status is updated to "confirmed" if the lead acknowledges

### Story 5.7: Appointment Reminders

As the system,
I want to send appointment reminders at 24hr and 1hr before,
So that appointment show rates are maximized.

**Acceptance Criteria:**

**Given** a confirmed appointment exists
**When** the scheduled time is 24 hours away
**Then** a WhatsApp reminder is sent to the lead with appointment details
**And** when the scheduled time is 1 hour away, a second reminder is sent
**And** reminders include a quick reschedule/cancel option
**And** reminder delivery is managed by Cloud Scheduler triggering a Cloud Function
**And** sent reminders are logged in the conversation history

### Story 5.8: Dashboard Calendar View

As a real estate agent,
I want to view all my appointments in a calendar interface,
So that I can manage my schedule visually.

**Acceptance Criteria:**

**Given** I am on the appointments page
**When** the calendar loads
**Then** I see a monthly/weekly/daily calendar view with all appointments
**And** appointments are color-coded by type (viewing, consultation, valuation)
**And** clicking an appointment shows: lead details, qualification summary, appointment notes
**And** I can create new appointments manually from the calendar
**And** the calendar data is fetched from Firestore `/appointments/` collection filtered by tenantId

### Story 5.9: Appointment Rescheduling & Cancellation

As a real estate agent,
I want to reschedule or cancel appointments,
So that I can manage changes in my schedule.

**Acceptance Criteria:**

**Given** I am viewing an appointment on the dashboard
**When** I click "Reschedule" or "Cancel"
**Then** for reschedule: I can select a new time slot from available slots, the calendar event is updated, and a WhatsApp notification is sent to the lead with the new time
**And** for cancel: the appointment status is set to "cancelled", the calendar event is deleted, and a WhatsApp notification is sent to the lead
**And** the lead's `appointment.scheduled` is updated accordingly
**And** all changes are logged in the conversation history as system messages

---

## Epic 6: Payments & Subscription Billing

Agents can subscribe to AgentFlow AI through market-appropriate payment providers (Paystack for Nigeria, Stripe for Dubai), manage their billing, and the system enforces subscription tier limits on lead count and features.

### Story 6.1: Payment Provider Configuration

As a real estate agent,
I want to set up my subscription payment method,
So that I can access the platform's features.

**Acceptance Criteria:**

**Given** I am on the billing settings page
**When** the page loads
**Then** the system displays the correct payment provider based on my market: Paystack for Nigeria, Stripe for Dubai
**And** I see the available subscription tiers with market-specific pricing:
  - Nigeria: Solo ₦25,000/mo, Team ₦75,000/mo, Brokerage ₦200,000/mo
  - Dubai: Solo AED 179/mo, Team AED 499/mo, Brokerage AED 1,299/mo
**And** I can select a tier and proceed to checkout
**And** the `integrations.payments` field on my tenant is updated with provider and tier

### Story 6.2: Paystack Payment Flow (Nigeria)

As a Nigerian real estate agent,
I want to pay for my subscription via Paystack,
So that I can use local payment methods (card, bank, USSD, mobile money).

**Acceptance Criteria:**

**Given** I am a Nigerian tenant and have selected a subscription tier
**When** I click "Subscribe"
**Then** a Paystack transaction is initialized via Cloud Function with: amount in kobo (NGN * 100), email, currency "NGN", channels [card, bank, ussd, qr, mobile_money]
**And** I am redirected to the Paystack checkout page
**And** upon successful payment, I am redirected back to the billing page
**And** the Paystack secret key is retrieved from Cloud Secret Manager (never exposed to client)
**And** the webhook handler processes the `charge.success` event

### Story 6.3: Stripe Payment Flow (Dubai)

As a Dubai real estate agent,
I want to pay for my subscription via Stripe,
So that I can use international payment methods (card, Apple Pay, Google Pay).

**Acceptance Criteria:**

**Given** I am a Dubai tenant and have selected a subscription tier
**When** I click "Subscribe"
**Then** a Stripe Payment Intent is created via Cloud Function with: amount in fils (AED * 100), currency "aed", receipt_email, metadata { tenantId }
**And** the Stripe checkout session or embedded form is presented
**And** upon successful payment, my subscription is activated
**And** the Stripe secret key is retrieved from Cloud Secret Manager
**And** the webhook handler processes the `payment_intent.succeeded` and `invoice.paid` events

### Story 6.4: Subscription Webhook Processing

As the system,
I want to process payment webhooks from Paystack and Stripe,
So that subscription status is always current.

**Acceptance Criteria:**

**Given** a payment event webhook arrives at `/webhook/paystack` or `/webhook/stripe`
**When** the Cloud Function processes it
**Then** the webhook signature is verified (Paystack: IP whitelist + hash; Stripe: webhook secret)
**And** the event type is matched: successful payment → activate/renew subscription; failed payment → flag for retry; cancellation → update status
**And** the tenant's `status` is updated: "active" on payment, "suspended" on failure after retries
**And** webhook handlers are idempotent (NFR17) — duplicate events are safely ignored
**And** processing logs are stored for audit

### Story 6.5: Subscription Tier Limit Enforcement

As the system,
I want to enforce subscription tier limits,
So that agents cannot exceed their plan's lead count or agent count.

**Acceptance Criteria:**

**Given** a tenant has an active subscription tier
**When** a new lead is created or a new agent is invited
**Then** the system checks current usage against tier limits: Solo (100 leads/mo, 1 agent), Team (500 leads/mo, 5 agents), Brokerage (unlimited)
**And** if the lead limit is reached, new WhatsApp-initiated leads receive an auto-response directing them to the agent directly, and the agent is notified
**And** if the agent limit is reached, admin cannot invite more agents
**And** usage counters are tracked in `tenant.usage.leadsThisMonth` and reset monthly
**And** approaching-limit warnings are shown on the dashboard at 80% and 95% usage

### Story 6.6: Billing Dashboard & History

As a real estate agent,
I want to view my billing history and current subscription status,
So that I can track my payments and plan.

**Acceptance Criteria:**

**Given** I am on the billing page
**When** the page loads
**Then** I see: current tier, next billing date, payment method on file, subscription status (active/trial/suspended)
**And** I see billing history with: date, amount (in tenant currency), status, invoice/receipt link
**And** I can upgrade or downgrade my tier
**And** I can update my payment method
**And** all monetary values are displayed in my tenant's currency

### Story 6.7: Failed Payment Handling & Dunning

As the system,
I want to handle failed payments with retry logic and notifications,
So that agents don't lose access due to temporary payment issues.

**Acceptance Criteria:**

**Given** a subscription payment fails
**When** the webhook reports failure
**Then** the system retries the payment 3 times over 7 days (day 1, day 3, day 7)
**And** the agent receives a WhatsApp notification about the failed payment with instructions to update their payment method
**And** after 3 failed retries, the tenant status is set to "suspended"
**And** suspended tenants see a banner: "Your subscription is inactive. Update payment to continue."
**And** AI conversations are paused for suspended tenants
**And** lead data is preserved (not deleted) during suspension

### Story 6.8: Payment Receipts via WhatsApp

As a real estate agent,
I want to receive payment receipts via WhatsApp,
So that I have convenient confirmation of my payments.

**Acceptance Criteria:**

**Given** a successful subscription payment is processed
**When** the webhook handler completes
**Then** a WhatsApp message is sent to the agent with: amount paid (formatted in tenant currency with symbol), tier name, billing period, next billing date
**And** the receipt message uses utility pricing (not marketing) for WhatsApp cost optimization
**And** the receipt is also viewable on the billing dashboard

---

## Epic 7: Compliance & Audit System

The platform enforces NDPR (Nigeria) and RERA (Dubai) regulations with consent capture, audit trails, compliance checks on AI messages, fraud detection, and regulatory reporting capabilities.

### Story 7.1: NDPR Consent Capture (Nigeria)

As the system,
I want to capture and store NDPR consent records for Nigerian leads,
So that all data processing complies with Nigeria's data protection regulation.

**Acceptance Criteria:**

**Given** a new lead is created for a Nigerian tenant
**When** the first AI message is sent
**Then** the message includes an NDPR consent request: "[Agent name] would like to use your information to help find you a property. Do you consent to us storing and processing your data? Reply YES to continue."
**And** the lead's consent response is captured and stored with: timestamp, consent text, method (WhatsApp reply)
**And** if consent is declined, AI conversations are stopped and the agent is notified
**And** consent records are stored in a subcollection `/leads/{leadId}/consent/`
**And** consent status is visible on the lead detail page

### Story 7.2: Data Deletion Requests (NDPR)

As a real estate agent,
I want to process data deletion requests within 30 days,
So that I comply with NDPR right-to-deletion requirements.

**Acceptance Criteria:**

**Given** a lead requests deletion of their data
**When** the agent initiates a deletion request from the lead detail page
**Then** a deletion request is created with 30-day deadline
**And** after confirmation, all lead data is purged: lead document, all messages, consent records, appointment records
**And** the deletion is logged in the compliance audit trail (without PII — only "Lead {id} deleted per NDPR request")
**And** the agent receives confirmation when deletion is complete
**And** deletion cannot be reversed after execution

### Story 7.3: RERA Compliance Pre-Send Check (Dubai)

As the system,
I want to apply RERA compliance checks to AI messages before sending,
So that no AI-generated message violates Dubai's real estate advertising regulations.

**Acceptance Criteria:**

**Given** an AI message is generated for a Dubai tenant's lead
**When** the compliance check runs before sending
**Then** the message is scanned for: guaranteed ROI language ("guaranteed returns", "assured yield"), specific return percentages presented as promises, nationality-based area steering ("as an Indian buyer, you should look at...")
**And** messages containing violations are flagged and rewritten by the AI
**And** `metadata.complianceCheck` is set to "passed" or "flagged" or "blocked"
**And** the RERA check runs on every AI message — no bypassing
**And** a blocked phrases list is maintained in the market_config document and can be updated

### Story 7.4: Communication Audit Trail (5-Year Retention)

As the system,
I want to maintain a 5-year audit trail of all communications,
So that Dubai tenants comply with RERA's record-keeping requirements.

**Acceptance Criteria:**

**Given** any message is sent or received (AI or human, WhatsApp or system)
**When** the message is logged
**Then** the message document includes: full content, sender type, channel, timestamp, compliance check result, AI model used, tokens consumed
**And** messages cannot be deleted or modified after creation (append-only)
**And** for Dubai tenants, a TTL of 5 years is applied (messages auto-delete after 5 years)
**And** for Nigeria tenants, messages respect NDPR deletion requests
**And** all audit records are queryable by tenant, date range, and compliance status

### Story 7.5: Compliance Violation Flagging & Logging

As the system,
I want to flag and log compliance violations with reason codes,
So that patterns can be detected and addressed.

**Acceptance Criteria:**

**Given** a compliance check detects a potential violation
**When** the violation is logged
**Then** a compliance event document is created with: tenantId, leadId, messageId, violation type (enum: rera_roi_guarantee, rera_nationality_steering, ndpr_consent_missing, fraud_indicator), severity (warning/critical), timestamp, resolution status
**And** critical violations trigger immediate agent notification via WhatsApp
**And** warning violations are surfaced on the dashboard
**And** violation history is accessible from the compliance reporting page

### Story 7.6: Fraud Pattern Detection

As the system,
I want to detect and flag suspicious patterns per market,
So that agents and their leads are protected from fraudulent activity.

**Acceptance Criteria:**

**Given** AI conversations are processing lead messages
**When** suspicious patterns are detected
**Then** for Nigeria: flags "distress sale" language, upfront commission requests, personal bank detail requests, significantly below-market pricing
**And** for Dubai: flags guaranteed ROI demands, requests to bypass documentation, suspicious payment routing
**And** flagged leads are marked with `qualification.readiness` flags and escalated to the agent
**And** the AI pauses automatic responses on flagged leads until agent review
**And** fraud flags are logged in the compliance audit trail

### Story 7.7: Compliance Audit Reports

As a real estate agent,
I want to generate compliance audit reports for my tenant,
So that I can demonstrate regulatory compliance to authorities.

**Acceptance Criteria:**

**Given** I am on the compliance page (Brokerage tier) or reports section
**When** I request an audit report for a date range
**Then** the report includes: total messages sent/received, compliance check pass/flag/block counts, escalation events, consent records (Nigeria), violation log with resolutions
**And** the report is generated as a downloadable document
**And** for Dubai: report format aligns with RERA audit requirements
**And** for Nigeria: report includes NDPR compliance summary

---

## Epic 8: Analytics, Reporting & Team Management

Agents can view performance analytics and usage metrics. Brokerage admins can invite and manage multiple agents, view cross-agent performance, and export data.

### Story 8.1: Performance Analytics Dashboard

As a real estate agent,
I want to view analytics on my lead performance,
So that I can understand my conversion funnel and improve.

**Acceptance Criteria:**

**Given** I am on the analytics page
**When** the page loads
**Then** I see: leads by source (pie chart), lead-to-appointment conversion rate, average response time, appointment show rate, leads by urgency over time
**And** all metrics are filterable by date range (7d, 30d, 90d, custom)
**And** charts update in real-time as data changes
**And** all values display in tenant currency where applicable

### Story 8.2: Usage Metrics Dashboard

As a real estate agent,
I want to view my platform usage metrics,
So that I can track consumption against my subscription limits.

**Acceptance Criteria:**

**Given** I am on the usage page or dashboard widget
**When** the page loads
**Then** I see: WhatsApp conversations this month (count and cost), AI tokens consumed, appointments booked, leads ingested vs tier limit
**And** a usage bar shows current consumption vs tier limit with color coding (green/yellow/red)
**And** cost breakdown shows utility vs marketing WhatsApp message costs
**And** data is sourced from `/usage_logs/` collection aggregated by month

### Story 8.3: Team Management & Agent Invitations

As a brokerage admin,
I want to invite and manage multiple agents within my tenant,
So that my team can use the platform under a shared account.

**Acceptance Criteria:**

**Given** I am on a Team or Brokerage tier
**When** I navigate to team management
**Then** I can invite agents by email (sends Firebase Auth invitation)
**And** invited agents sign up and are associated with my tenant
**And** I can view all agents: name, status (active/invited/disabled), leads assigned, last active
**And** I can disable/re-enable agent access
**And** agent count is enforced per tier (Team: 5, Brokerage: unlimited)
**And** each agent has their own profile but shares tenant configuration (WhatsApp, calendar, AI settings)

### Story 8.4: Team Performance Metrics

As a brokerage admin,
I want to view performance metrics across all agents,
So that I can identify top performers and coaching opportunities.

**Acceptance Criteria:**

**Given** I am an admin on a Team or Brokerage tier
**When** I navigate to team analytics
**Then** I see a table comparing all agents: leads handled, response time, appointment rate, conversion rate, active conversations
**And** I can sort by any metric
**And** I can filter by date range
**And** individual agent drill-down shows their full analytics
**And** this view is only accessible to the tenant admin, not individual agents

### Story 8.5: Lead Data Export

As a real estate agent,
I want to export my lead data in CSV format,
So that I can use it in external tools or for reporting.

**Acceptance Criteria:**

**Given** I am on the leads page
**When** I click "Export CSV"
**Then** a CSV file is generated with all leads matching current filters
**And** columns include: name, phone, email, status, score, urgency, source, property type, budget, timeline, created date, last activity
**And** market-specific fields are included based on tenant market
**And** the export respects current filter selections
**And** large exports (>1000 leads) are generated asynchronously with a download link sent to the dashboard

---

## Epic 9: External Lead Sources

System can ingest leads from property portal webhooks (Property Finder, Bayut for Dubai; Nigerian Property Centre for Nigeria), normalizing them into the universal lead schema and triggering AI qualification automatically.

### Story 9.1: External Webhook Lead Ingestion Endpoints

As the system,
I want to receive leads from property portal webhooks,
So that agents get automatic AI qualification of leads from external sources.

**Acceptance Criteria:**

**Given** a property portal sends a lead webhook
**When** the Cloud Function at `/webhook/property-finder`, `/webhook/bayut`, or `/webhook/nigerian-property-centre` receives the request
**Then** the payload is parsed according to the source's format
**And** the lead data is normalized to the universal schema (FR14): contact info, property interest, source identifier
**And** the `tenantId` is resolved from the webhook configuration (API key → tenant mapping)
**And** a new lead document is created with `source` set to the portal name
**And** the AI conversation orchestrator is triggered for the new lead
**And** duplicate detection checks if a lead with the same phone number already exists for this tenant
**And** if duplicate, the new inquiry is appended to the existing lead's conversation

### Story 9.2: Webhook Configuration for External Sources

As a real estate agent,
I want to configure webhook connections to property portals,
So that my portal leads flow into AgentFlow AI automatically.

**Acceptance Criteria:**

**Given** I am on the integrations settings page
**When** I select an external lead source to connect
**Then** the system generates a unique webhook URL for my tenant: `https://[domain]/webhook/{source}?key={tenant_api_key}`
**And** I see setup instructions for each supported portal (Property Finder, Bayut, Nigerian Property Centre)
**And** I can test the webhook with a sample payload
**And** I can enable/disable each source independently
**And** the `integrations.crm` field on my tenant is updated with webhook configuration

---

*All 67 functional requirements are covered across 9 epics and 38 stories. Each story is independently completable, builds on previous stories within its epic, and includes testable acceptance criteria in Given/When/Then format.*
