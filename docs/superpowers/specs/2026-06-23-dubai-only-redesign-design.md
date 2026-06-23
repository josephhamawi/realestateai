# Dubai/UAE-Only Redesign Design

Date: 2026-06-23
Status: Approved (Approach A)

## Goal

Convert AgentFlow AI from a multi-market platform (Nigeria + Dubai) into a Dubai/UAE-only product. Hard rip-out of all Nigeria code and data. Keep the multi-tenant SaaS structure (many Dubai agents and brokerages each get an isolated tenant). Functional de-scope only: no visual or branding refresh in this pass.

## Decisions

1. **Removal depth:** Hard rip-out. Delete all Nigeria code, services, personas, compliance, areas, currency, and the Nigeria market config doc.
2. **Tenancy:** Keep multi-tenant. Only the multi-MARKET layer is removed.
3. **Scope:** Functional only. Keep current UI design and branding. Update copy where it names Nigeria or multi-market. Final prose polish is deferred to a later stop-slop pass.
4. **Market field approach (Approach A):** Keep the `market` field but lock its type to the literal `"dubai"`. Do not remove the field. This avoids a Firestore data migration on live data and keeps existing documents, `phone_mappings`, and indexes valid (the active tenant already stores `"dubai"`).

## Rationale for Approach A over full field removal

Full removal (Approach B) would strip `market` from every type, Firestore document, and query across ~43 files and require a live data migration. It yields the same Dubai-only behavior as Approach A with materially higher risk and effort. Approach A deletes all Nigeria code paths and values while leaving the now single-valued field in place.

## Surface area (measured)

- `nigeria` references: 32 files
- `paystack` references: 12 files
- `ndpr` / `NGN` references: 14 files
- `chioma` references: 6 files
- `market` references: 43 files

## Changes

### Backend (`functions/src`)

- **Delete** `services/paystack.ts`.
- `functions/paymentProcessor.ts`: Stripe-only. Remove the market branch and the `getPaymentProvider` call.
- `index.ts`: remove the `paystackWebhook` export.
- `services/claude.ts`: Aisha persona only. Remove Chioma and all Nigeria prompt logic.
- `utils/compliance.ts`: RERA only. Remove NDPR phrases and the NDPR branch.
- `utils/marketConfig.ts`: `loadMarketConfig` resolves a fixed `"dubai"` (no market argument). Delete `getPaymentProvider`.
- `functions/provisionTenant.ts`: always provision Dubai defaults. Remove the market parameter and Nigeria branch.
- `config/secrets.ts`: remove `getPaystackConfig`.
- Types:
  - `types/market.ts`: `MarketId = "dubai"`. Replace `MARKET_DEFAULTS` record with a single Dubai default. Remove Nigeria lead source `nigerian_property_centre`.
  - `types/lead.ts`: drop Nigeria-only property fields (for example C of O / Governor's Consent title fields). Keep Dubai fields (off-plan, freehold, etc).
  - `types/tenant.ts`: lock `market` to `"dubai"`. Remove Paystack integration shape.
- `functions/leadIngestion.ts`, `functions/telegramWebhook.ts`, `functions/complianceLogger.ts`, `utils/validation.ts`, `utils/scoring.ts`: remove Nigeria branches keyed on market.
- `functions/dailyBatchJobs.ts`: remove NDPR auto-deletion branch (file is not deployed but kept consistent).

### Frontend (`src`)

- `lib/marketConfig.ts`: replace the `MARKET_DEFAULTS` dict with a single Dubai constant. Remove Nigeria areas, property types, NGN currency, and Nigeria lead sources. `MarketId = "dubai"`.
- `contexts/MarketContext.tsx`: load `market_config/dubai` as a fixed path. `marketId` type becomes `"dubai"`.
- `components/market/MarketSelector.tsx`: **delete**. Remove its usage from `Onboarding.tsx` (no market choice; Dubai is implicit).
- `pages/Billing.tsx`: Stripe / AED only. Remove Paystack flow and NGN tier pricing.
- `pages/Admin.tsx`: remove Paystack config fields from the platform API form.
- `pages/Settings.tsx`: persona is Aisha (remove the `market === "dubai" ? "Aisha" : "Chioma"` ternary). Phone prefix fixed to `+971`.
- `components/leads/LeadForm.tsx`: fix the pre-existing currency TS bug (render `currency.symbol`, not the currency object). Remove Nigeria options.
- `contexts/TenantContext.tsx`: remove Paystack from the integrations shape; `market` type becomes `"dubai"`.
- `components/layout/Header.tsx`: remove any Nigeria market display branch.
- `hooks/useLeads.ts`, `hooks/useAppointments.ts`, `pages/Analytics.tsx`, `pages/Usage.tsx`, `pages/Compliance.tsx`: remove Nigeria branches.
- Copy updates (mentions of Nigeria, NDPR, Paystack, NGN, Lagos): `pages/PrivacyPolicy.tsx`, `pages/TermsOfService.tsx`, `pages/AboutUs.tsx`, `pages/Contact.tsx`, `pages/LandingPage.tsx`. Functional copy edits only; the full prose rewrite is the later stop-slop pass.

### Data (Firestore)

- Delete the `market_config/nigeria` document. Keep `market_config/dubai`.
- No type or field migration. The `market` field remains and stays `"dubai"`.

## Out of scope (deferred to the polish pass)

- Visual / branding refresh.
- Standard brand footer (website-footer skill).
- Logo (Blender or SVG).
- Full prose rewrite (stop-slop) across the app and welcome page.

## Success criteria

- No reference to Nigeria, Paystack, NDPR, NGN, Chioma, Lagos, or Abuja remains in `src` or `functions/src` (verified by grep).
- `functions` build passes (`npm run build`).
- Frontend typecheck passes for all touched files (no new errors; the pre-existing `LeadForm` currency bug is fixed).
- Payments route only through Stripe (AED).
- AI persona is Aisha only. Compliance framework is RERA only.
- Onboarding has no market selector and provisions a Dubai tenant.
- `market_config/nigeria` deleted; `market_config/dubai` intact.

## Risks

- Live Firestore documents that contain Nigeria data (if any tenant was created as Nigeria) will not be auto-migrated. Mitigation: confirm no production Nigeria tenants exist before deploy; if any, handle manually.
- Removing Nigeria-only lead fields from types may surface compile errors where those fields are read. Mitigation: build and typecheck after each layer.
