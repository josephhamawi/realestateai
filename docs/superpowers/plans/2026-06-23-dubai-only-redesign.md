# Dubai/UAE-Only Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert AgentFlow AI from multi-market (Nigeria + Dubai) to Dubai/UAE-only by deleting all Nigeria code, services, personas, compliance, and data, while keeping the multi-tenant SaaS structure.

**Architecture:** Approach A from the spec. Keep the `market` field but lock its type to the literal `"dubai"`. Delete every Nigeria branch, value, and file. No Firestore field migration. Payments become Stripe-only, AI persona becomes Aisha-only, compliance becomes RERA-only.

**Tech Stack:** React 18 + Vite + TypeScript (frontend `src/`), Firebase Cloud Functions Node 20 + TypeScript (backend `functions/src/`), Firestore.

**Verification model:** No unit-test harness exists in this repo. Each task verifies with build (`npm run build`), typecheck (`npx tsc --noEmit`), and grep assertions (deleted terms return zero hits). These are the "tests" for this refactor.

**Spec:** `docs/superpowers/specs/2026-06-23-dubai-only-redesign-design.md`

**Branch:** Create `dubai-only` before Task 1 (`git checkout -b dubai-only`). All commits land there.

---

## File map

Delete:
- `functions/src/services/paystack.ts`
- `src/components/market/MarketSelector.tsx`
- Firestore doc `market_config/nigeria`

Modify (backend): `functions/src/types/market.ts`, `types/lead.ts`, `types/tenant.ts`, `services/claude.ts`, `config/secrets.ts`, `utils/marketConfig.ts`, `utils/compliance.ts`, `utils/validation.ts`, `utils/scoring.ts`, `functions/paymentProcessor.ts`, `index.ts`, `functions/provisionTenant.ts`, `functions/leadIngestion.ts`, `functions/telegramWebhook.ts`, `functions/complianceLogger.ts`, `functions/dailyBatchJobs.ts`.

Modify (frontend): `src/lib/marketConfig.ts`, `contexts/MarketContext.tsx`, `contexts/TenantContext.tsx`, `pages/Onboarding.tsx`, `pages/Billing.tsx`, `pages/Admin.tsx`, `pages/Settings.tsx`, `components/leads/LeadForm.tsx`, `components/layout/Header.tsx`, `hooks/useLeads.ts`, `hooks/useAppointments.ts`, `pages/Analytics.tsx`, `pages/Usage.tsx`, `pages/Compliance.tsx`, `pages/PrivacyPolicy.tsx`, `pages/TermsOfService.tsx`, `pages/AboutUs.tsx`, `pages/Contact.tsx`, `pages/LandingPage.tsx`.

---

## Task 0: Branch and baseline

**Files:** none (git only)

- [ ] **Step 1: Create branch**

```bash
git checkout -b dubai-only
```

- [ ] **Step 2: Capture baseline grep counts**

Run: `grep -ric "nigeria" src functions/src | awk -F: '{s+=$2} END {print s}'`
Record the number. Goal by end of plan: Nigeria/Paystack/NDPR/NGN/Chioma/Lagos/Abuja all reach zero in `src` and `functions/src`.

- [ ] **Step 3: Confirm baseline builds**

Run: `cd functions && npm run build`
Expected: PASS (compiles). If it fails, stop and fix the existing error before refactoring.

---

## Task 1: Backend types to Dubai-only

**Files:**
- Modify: `functions/src/types/market.ts`
- Modify: `functions/src/types/lead.ts`
- Modify: `functions/src/types/tenant.ts`

- [ ] **Step 1: Read all three type files**

Run: `sed -n '1,200p' functions/src/types/market.ts functions/src/types/lead.ts functions/src/types/tenant.ts`
Identify: the `MarketId` / market union type, the `MARKET_DEFAULTS` record (if present here), Nigeria-only lead fields (C of O, Governor's Consent), the `nigerian_property_centre` lead source, and the Paystack integration shape on the tenant.

- [ ] **Step 2: Collapse the market type**

In `types/market.ts`, change the market union to the single literal:

```ts
export type MarketId = "dubai";
```

Remove the Nigeria entry from any `Record<MarketId, ...>` map so it has only the `dubai` key. Remove `nigerian_property_centre` from the lead-source union/list.

- [ ] **Step 3: Remove Nigeria-only lead fields**

In `types/lead.ts`, delete the Nigeria-specific property-interest fields (for example `certificateOfOccupancy`, `governorsConsent`, or any field commented as Nigeria-only). Keep all Dubai and shared fields.

- [ ] **Step 4: Lock tenant market and drop Paystack shape**

In `types/tenant.ts`, change the `market` field type to `"dubai"`. Remove the Paystack entry from the `integrations.payments` shape, leaving Stripe.

- [ ] **Step 5: Build**

Run: `cd functions && npm run build`
Expected: compile errors ONLY in files that still reference removed symbols (Nigeria fields, `nigerian_property_centre`, Paystack shape). That is expected; those files are fixed in later tasks. Note the error list.

- [ ] **Step 6: Commit**

```bash
git add functions/src/types
git commit -m "refactor: lock backend types to Dubai-only market"
```

---

## Task 2: Backend services and secrets

**Files:**
- Delete: `functions/src/services/paystack.ts`
- Modify: `functions/src/config/secrets.ts`
- Modify: `functions/src/services/claude.ts`

- [ ] **Step 1: Delete Paystack service**

```bash
git rm functions/src/services/paystack.ts
```

- [ ] **Step 2: Remove getPaystackConfig**

In `config/secrets.ts`, delete the entire `getPaystackConfig` function (the block documented "Get Paystack config from platform_config", roughly lines 113-126).

- [ ] **Step 3: Make AI persona Aisha-only**

In `services/claude.ts`, read the file first (`sed -n '1,120p' functions/src/services/claude.ts`). Remove the Chioma persona and any `market === "nigeria"` branch in the system-prompt builder so only the Aisha / Dubai prompt remains. Remove NDPR references in prompts; keep RERA.

- [ ] **Step 4: Build**

Run: `cd functions && npm run build`
Expected: remaining errors only in callers of `getPaystackConfig` / paystack service (fixed in Task 3 and 4).

- [ ] **Step 5: Commit**

```bash
git add functions/src/services functions/src/config/secrets.ts
git commit -m "refactor: delete Paystack service, Aisha-only AI persona"
```

---

## Task 3: Backend utils

**Files:**
- Modify: `functions/src/utils/marketConfig.ts`
- Modify: `functions/src/utils/compliance.ts`
- Modify: `functions/src/utils/validation.ts`
- Modify: `functions/src/utils/scoring.ts`

- [ ] **Step 1: Fix marketConfig loader and drop payment-provider switch**

In `utils/marketConfig.ts`, change `loadMarketConfig` to resolve a fixed `"dubai"` doc and delete `getPaymentProvider`:

```ts
export async function loadMarketConfig(): Promise<MarketConfig> {
  const now = Date.now();
  const cached = marketConfigCache["dubai"];
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }
  const snap = await db.doc("market_config/dubai").get();
  if (!snap.exists) {
    throw new Error("Market config not found for: dubai");
  }
  const data = snap.data() as MarketConfig;
  marketConfigCache["dubai"] = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}
```

Delete the `getPaymentProvider` function entirely. Keep `loadTenant` and `isLeadLimitReached`.

- [ ] **Step 2: Compliance RERA-only**

In `utils/compliance.ts`, read first. Remove the NDPR branch and NDPR blocked-phrase list. Keep RERA logic. Remove any `market === "nigeria"` conditionals.

- [ ] **Step 3: Strip Nigeria branches from validation and scoring**

In `utils/validation.ts` and `utils/scoring.ts`, remove any `market === "nigeria"` / Nigeria-specific branches, keeping the Dubai path as the only path.

- [ ] **Step 4: Build**

Run: `cd functions && npm run build`
Expected: remaining errors only in function handlers (Task 4).

- [ ] **Step 5: Commit**

```bash
git add functions/src/utils
git commit -m "refactor: Dubai-only market config, RERA-only compliance"
```

---

## Task 4: Backend function handlers and exports

**Files:**
- Modify: `functions/src/functions/paymentProcessor.ts`
- Modify: `functions/src/index.ts`
- Modify: `functions/src/functions/provisionTenant.ts`
- Modify: `functions/src/functions/leadIngestion.ts`
- Modify: `functions/src/functions/telegramWebhook.ts`
- Modify: `functions/src/functions/complianceLogger.ts`
- Modify: `functions/src/functions/dailyBatchJobs.ts`

- [ ] **Step 1: Stripe-only payment processor**

In `functions/paymentProcessor.ts`, read first. Remove the Paystack branch and the `getPaymentProvider` usage. The handler always uses Stripe. Remove the Paystack import.

- [ ] **Step 2: Remove paystackWebhook export**

In `index.ts`, delete the `paystackWebhook` export line and its import. Keep `stripeWebhook`.

- [ ] **Step 3: Provision Dubai tenants only**

In `functions/provisionTenant.ts`, remove the market parameter / Nigeria branch. Always provision with Dubai defaults (`market: "dubai"`).

- [ ] **Step 4: Strip Nigeria branches from remaining handlers**

In `leadIngestion.ts`, `telegramWebhook.ts`, `complianceLogger.ts`, remove `market === "nigeria"` branches. In `dailyBatchJobs.ts`, remove the NDPR auto-deletion branch (file is not deployed but kept consistent).

- [ ] **Step 5: Build (must be clean now)**

Run: `cd functions && npm run build`
Expected: PASS with zero errors.

- [ ] **Step 6: Grep assertion (backend clean)**

Run: `grep -rinE "nigeria|paystack|ndpr|chioma|naira|\\bNGN\\b|Lagos|Abuja" functions/src`
Expected: zero output.

- [ ] **Step 7: Commit**

```bash
git add functions/src
git commit -m "refactor: Stripe-only payments, Dubai-only provisioning, remove Nigeria handlers"
```

---

## Task 5: Frontend market config, contexts

**Files:**
- Modify: `src/lib/marketConfig.ts`
- Modify: `src/contexts/MarketContext.tsx`
- Modify: `src/contexts/TenantContext.tsx`

- [ ] **Step 1: Single Dubai default**

In `src/lib/marketConfig.ts`, change `MarketId` to `"dubai"`. Replace the `MARKET_DEFAULTS` record with a single Dubai constant (keep the Dubai values already present: AED currency, `Asia/Dubai`, `+971`, Dubai areas, Dubai property types, weekend `["fri","sat"]`). Remove the Nigeria block. In `LEAD_SOURCES`, remove `nigerian_property_centre`.

Example shape:

```ts
export type MarketId = "dubai";

export const DUBAI_DEFAULTS: MarketDefaults = {
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
};
```

If any code consumed `MARKET_DEFAULTS[market]`, update it to use `DUBAI_DEFAULTS` (handled per-file in later tasks; note the new export name).

- [ ] **Step 2: Fixed Dubai MarketContext**

In `contexts/MarketContext.tsx`, change `marketId` type to `"dubai"`, and load `market_config/dubai` as a fixed path (drop the `tenant.market` dependency for the doc id; keep loading guarded by tenant existence). Remove the NDPR option from the `compliance.framework` type, leaving `"RERA"`.

- [ ] **Step 3: TenantContext market type and Paystack removal**

In `contexts/TenantContext.tsx`, change the `market` field type to `"dubai"`. Remove Paystack from the integrations payments shape.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "marketConfig|MarketContext|TenantContext"`
Expected: no errors from these three files. Errors elsewhere are expected until later tasks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketConfig.ts src/contexts/MarketContext.tsx src/contexts/TenantContext.tsx
git commit -m "refactor: Dubai-only frontend market config and contexts"
```

---

## Task 6: Frontend components

**Files:**
- Delete: `src/components/market/MarketSelector.tsx`
- Modify: `src/pages/Onboarding.tsx`
- Modify: `src/components/leads/LeadForm.tsx`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Delete MarketSelector**

```bash
git rm src/components/market/MarketSelector.tsx
```

- [ ] **Step 2: Remove MarketSelector from onboarding**

In `pages/Onboarding.tsx`, read first. Remove the `MarketSelector` import and its render/step. The market is implicitly Dubai; remove any market-choice state and default it to `"dubai"` where provisioning is called.

- [ ] **Step 3: Fix LeadForm currency bug and remove Nigeria options**

In `components/leads/LeadForm.tsx`, the pre-existing TS error is rendering a currency object as a ReactNode (lines ~131 and ~142). Render the symbol string instead:

```tsx
{currency.symbol}
```

(where the code currently outputs `currency`). Remove Nigeria areas/property-type/source options so only Dubai options render.

- [ ] **Step 4: Remove Nigeria branch from Header**

In `components/layout/Header.tsx`, remove any `market === "nigeria"` display branch (for example a Nigeria flag/label). Show the Dubai label unconditionally.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "LeadForm|Onboarding|Header|MarketSelector"`
Expected: no errors from these files (LeadForm currency error gone).

- [ ] **Step 6: Commit**

```bash
git add src/components src/pages/Onboarding.tsx
git commit -m "refactor: remove market selector, fix LeadForm currency, Dubai-only components"
```

---

## Task 7: Frontend pages (functional)

**Files:**
- Modify: `src/pages/Billing.tsx`
- Modify: `src/pages/Admin.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/hooks/useLeads.ts`
- Modify: `src/hooks/useAppointments.ts`
- Modify: `src/pages/Analytics.tsx`
- Modify: `src/pages/Usage.tsx`
- Modify: `src/pages/Compliance.tsx`

- [ ] **Step 1: Billing Stripe/AED only**

In `pages/Billing.tsx`, read first. Remove the Paystack flow and NGN tier pricing. Keep Stripe checkout and AED tier prices (solo 179, team 499, brokerage 1299).

- [ ] **Step 2: Admin drop Paystack fields**

In `pages/Admin.tsx`, remove the Paystack section from the `ApiConfig` type, the default config object, and the form. Keep Stripe, WhatsApp, Telegram, Vynn, Google, Microsoft.

- [ ] **Step 3: Settings persona and phone prefix**

In `pages/Settings.tsx`, replace the persona ternary `tenant?.market === "dubai" ? "Aisha" : "Chioma"` with `"Aisha"`. Fix the phone-number prefix selector to `+971` only (remove the `+234 NG` option).

- [ ] **Step 4: Strip Nigeria branches from hooks and analytics pages**

In `hooks/useLeads.ts`, `hooks/useAppointments.ts`, `pages/Analytics.tsx`, `pages/Usage.tsx`, `pages/Compliance.tsx`, remove `market === "nigeria"` branches and Nigeria-specific labels (NGN formatting, NDPR copy in Compliance). Compliance page shows RERA only.

- [ ] **Step 5: Typecheck (full, must be clean for these files)**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "Billing|Admin|Settings|useLeads|useAppointments|Analytics|Usage|Compliance"`
Expected: no errors from these files.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Billing.tsx src/pages/Admin.tsx src/pages/Settings.tsx src/hooks src/pages/Analytics.tsx src/pages/Usage.tsx src/pages/Compliance.tsx
git commit -m "refactor: Dubai-only billing, admin, settings, analytics"
```

---

## Task 8: Copy edits (functional only)

**Files:**
- Modify: `src/pages/PrivacyPolicy.tsx`
- Modify: `src/pages/TermsOfService.tsx`
- Modify: `src/pages/AboutUs.tsx`
- Modify: `src/pages/Contact.tsx`
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Strip Nigeria/NDPR/Paystack/NGN mentions**

For each file, read it and replace multi-market or Nigeria-specific copy with Dubai/UAE equivalents:
- Legal pages: NDPR references become RERA / UAE PDPL data-protection language; remove Paystack as a named processor (keep Stripe).
- AboutUs / Contact / LandingPage: remove "Nigeria and Dubai" / "two markets" phrasing; present Dubai/UAE as the single market. Remove Lagos/Abuja mentions and NGN pricing.

Keep edits functional and accurate. Do NOT do the full tone rewrite here; that is the later stop-slop pass. No em dashes (project rule).

- [ ] **Step 2: Grep assertion (frontend clean)**

Run: `grep -rinE "nigeria|paystack|ndpr|chioma|naira|\\bNGN\\b|Lagos|Abuja" src`
Expected: zero output.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PrivacyPolicy.tsx src/pages/TermsOfService.tsx src/pages/AboutUs.tsx src/pages/Contact.tsx src/pages/LandingPage.tsx
git commit -m "refactor: Dubai-only copy in legal and marketing pages"
```

---

## Task 9: Firestore data cleanup

**Files:** none (data operation)

- [ ] **Step 1: Confirm no production Nigeria tenants**

Per the spec risk note, before deleting, confirm no live tenant has `market: "nigeria"`. If the Firebase CLI is authenticated:

Run: `firebase firestore:query --help` (or use the console). Inspect `tenants` for any `market == "nigeria"`. If found, stop and handle manually (out of plan scope).

- [ ] **Step 2: Delete the Nigeria market config doc**

Via Firebase console or CLI, delete `market_config/nigeria`. Keep `market_config/dubai`.

If using the console: Firestore > `market_config` > `nigeria` > Delete document.

- [ ] **Step 3: Commit (note only, no code)**

No code change. Record completion in the PR description: "Deleted Firestore doc `market_config/nigeria`."

---

## Task 10: Final verification

**Files:** none

- [ ] **Step 1: Full grep sweep**

Run: `grep -rinE "nigeria|paystack|ndpr|chioma|naira|\\bNGN\\b|Lagos|Abuja|nigerian_property_centre" src functions/src`
Expected: zero output. If any hit remains, fix in the owning file and re-commit.

- [ ] **Step 2: Backend build**

Run: `cd functions && npm run build`
Expected: PASS, zero errors.

- [ ] **Step 3: Frontend typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: zero errors (including the previously-broken `LeadForm` currency lines, now fixed). If pre-existing unrelated errors in `LeadDetail.tsx` `feedback` field remain, confirm they are out of scope or fix if trivial.

- [ ] **Step 4: Frontend build**

Run: `npm run build`
Expected: Vite build succeeds.

- [ ] **Step 5: Verify market literal**

Run: `grep -rn "\"nigeria\"\|'nigeria'" src functions/src`
Expected: zero output. `grep -rn "MarketId" src/lib/marketConfig.ts functions/src/types/market.ts` should show `= "dubai"`.

- [ ] **Step 6: Final commit / ready for PR**

```bash
git add -A
git commit -m "refactor: complete Dubai-only redesign"
```

---

## Self-review notes

- Spec coverage: every spec change item maps to a task (types T1, services T2, utils T3, handlers T4, frontend config T5, components T6, pages T7, copy T8, data T9, success-criteria verification T10).
- The pre-existing `LeadForm` currency TS bug is fixed in Task 6 Step 3, satisfying the spec success criterion.
- The `LeadDetail.tsx` `feedback` errors are pre-existing and outside this spec's scope; flagged in Task 10 Step 3 rather than silently included.
- New export name `DUBAI_DEFAULTS` (Task 5) replaces `MARKET_DEFAULTS`; consumers are updated in Tasks 6-7.
