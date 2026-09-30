RealEstateAI
============

An open-source AI assistant for real estate agents. It talks to your inbound
leads on WhatsApp or Telegram, qualifies them (budget, timeline, area, property
type, ownership), scores each lead 0 to 100, books viewings into your calendar,
and hands the hot ones to you with a transcript.

You host it. You bring your own AI key. Nothing in this repo bills you, and
there is no paid plan, license key, or hosted service behind it.

Configured out of the box for the Dubai and UAE market: AED, RERA compliance
guardrails, freehold and off-plan vocabulary, Friday and Saturday weekend, and
prayer-time awareness.

This is the plain-text version of README.md. The Markdown version has the same
content plus screenshots.


HOW IT WORKS
------------

  Lead messages your WhatsApp or Telegram number
          |
          v
  Cloud Function webhook  (verifies signature, finds or creates the lead)
          |
          v
  AI service  ->  your AI provider (Anthropic, OpenAI, or Google Gemini)
          |          system prompt carries market rules + RERA constraints
          v
  Compliance check  (blocks guaranteed-return claims and other RERA risks,
          |          regenerates the reply if needed)
          v
  Reply sent back on the same channel, stored in Firestore
          |
          v
  Lead scored 0-100.  Score past your threshold -> flagged for handoff,
                      and the AI offers a viewing slot
          |
          v
  Calendar Manager  ->  Google Calendar or Outlook, plus an .ics invite

Everything lives in one Firebase project:

  src/                React + Vite dashboard: leads, conversations, calendar,
                      analytics, compliance log, settings, API keys
  functions/          Cloud Functions: channel webhooks, AI orchestration, lead
                      ingestion, calendar sync, compliance logging
  firestore.rules     Access control. Each agent reads only their own data; API
                      keys are readable only by the instance owner
  whatsapp-gateway/   Optional self-hosted WhatsApp bridge (Baileys)

Key design points:

  * Multi-tenant by account. Each signed-in agent gets a tenant document keyed
    by their uid, with their own leads, conversations, appointments, persona.
  * Bring-your-own-key, two levels. The instance owner sets keys on the API Keys
    screen for everyone; an individual agent can override with their own key in
    Settings, which then bills to their account.
  * Provider-agnostic AI. One adapter covers Anthropic, OpenAI, and Gemini.
    Switch provider or model without touching code.
  * Compliance is code, not a promise. Every outbound AI message is checked
    against blocked phrases and RERA rules before it is sent, and every flag is
    written to an append-only audit collection.


WHAT IT COSTS TO RUN
--------------------

The app is free. Your bills come from the providers you connect:

  AI provider             Per token, at their rates. Gemini has a free tier.
  Firebase                Free Spark tier covers light use; Cloud Functions
                          need the pay-as-you-go Blaze plan. Low traffic
                          usually stays near zero.
  Telegram                Nothing. No per-message cost.
  WhatsApp Business API   Per conversation. Optional.
  Calendar sync           Nothing.


SETUP
-----

1. Prerequisites

   - Node.js 20
   - A Google account
   - npm install -g firebase-tools
   - Java 21 or later, only for the local emulators

2. Create your Firebase project

   - console.firebase.google.com, create a project
   - Authentication  -> Get started -> enable Email/Password
   - Firestore       -> Create database -> production mode
   - Project settings -> General -> Your apps -> add a Web app, copy the config
   - Upgrade to the Blaze plan (needed for Cloud Functions), and set a budget
     alert while you are there

3. Configure and install

     git clone https://github.com/josephhamawi/realestateai.git
     cd realestateai

     cp .env.local.example .env.local                # Firebase web config
     cp .firebaserc.example .firebaserc              # your project id
     cp functions/.env.example functions/.env.local  # optional env keys

     npm install
     npm install --prefix functions

4. Deploy

     firebase use --add
     firebase deploy --only firestore:rules,firestore:indexes
     npm run build
     firebase deploy --only hosting,functions

5. Claim the instance and add your AI key

   - Open the deployed URL and create an account.
   - Go to /setup (API Keys in the sidebar) and click "Claim as owner".
     Do this immediately, before sharing the URL: the first account to claim it
     controls the keys.
   - Add at least one AI provider key:

       Anthropic (Claude)   console.anthropic.com/settings/keys
       OpenAI               platform.openai.com/api-keys
       Google Gemini        aistudio.google.com/app/apikey

   - Optionally add Telegram, WhatsApp, and calendar credentials there too.

   The assistant will not reply until at least one AI key is present.
   Everything else is optional.

6. Connect a channel

   Telegram (easiest, free): message @BotFather, send /newbot, paste the token
   into the Telegram tab on the API Keys screen, then call the
   registerTelegramWebhook function once to point Telegram at your webhook.

   WhatsApp: use the official Business API (Meta or 360dialog credentials go in
   the WhatsApp tab), or run whatsapp-gateway/ on a small VPS and point the
   gateway fields at it. See whatsapp-gateway/README.md.


LOCAL DEVELOPMENT
-----------------

     npm run emulators      # terminal 1, needs Java 21+
     npm run dev            # terminal 2, VITE_USE_EMULATORS=true in .env.local

Optional demo data so the dashboard is not empty:

     node tools/seed-demo.mjs your@email.com


CONFIGURATION
-------------

Every value can come from an environment variable or from the API Keys screen.
Environment variables win.

Frontend (.env.local), see .env.local.example: Firebase web config plus optional
branding (VITE_APP_NAME, VITE_OPERATOR_NAME, VITE_CONTACT_EMAIL,
VITE_PUBLIC_URL, VITE_REPO_URL).

Functions (functions/.env.local or the deployed environment), see
functions/.env.example:

  AI_PROVIDER                anthropic | openai | gemini (tried first)
  ANTHROPIC_API_KEY          Claude credentials
  ANTHROPIC_MODEL            default claude-opus-5
  OPENAI_API_KEY             OpenAI credentials
  OPENAI_MODEL               default gpt-4o
  GEMINI_API_KEY             Gemini credentials
  GEMINI_MODEL               default gemini-2.5-flash
  APP_BASE_URL               public URL of your app, for OAuth redirects
  FUNCTIONS_BASE_URL         only for a custom functions domain
  FUNCTIONS_REGION           only for a non-default region
  WHATSAPP_*, D360_API_KEY, BAILEYS_*    WhatsApp, depending on provider
  TELEGRAM_BOT_TOKEN         Telegram bot
  GOOGLE_CLIENT_ID/SECRET    Google Calendar OAuth
  MS_CLIENT_ID/SECRET        Outlook Calendar OAuth


SECURITY NOTES
--------------

  * Deploy firestore.rules before you use the app.
  * The first account to visit /setup claims the instance. Claim it yourself
    right after deploying.
  * API keys are stored in your own Firestore, readable only by instance
    owners, and are sent only to the provider they belong to.
  * .env.local and .firebaserc are gitignored. Keep them that way.
  * The legal pages (/terms, /privacy) are templates written for a Dubai
    deployment. Set VITE_OPERATOR_NAME and VITE_CONTACT_EMAIL, then have your
    own counsel review them before publishing. They are a starting point, not
    legal advice.


ADAPTING TO ANOTHER MARKET
--------------------------

Dubai specifics sit in a few places:

  functions/src/services/ai.ts        market block of the system prompt
  functions/src/utils/compliance.ts   regulator rules and blocked phrases
  src/lib/marketConfig.ts             currency, areas, property types, weekend
  market_config/dubai in Firestore    runtime overrides, seeded on first signup


LICENSE
-------

MIT. See the LICENSE file.
