import Stripe from "stripe";
import { getSecret } from "../config/secrets";

let stripeClient: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripeClient) {
    const secretKey = await getSecret("STRIPE_SECRET_KEY");
    stripeClient = new Stripe(secretKey, { apiVersion: "2023-10-16" as Stripe.LatestApiVersion });
  }
  return stripeClient;
}

export async function createCheckoutSession(
  tenantId: string,
  email: string,
  tier: "solo" | "team" | "brokerage"
): Promise<{ sessionId: string; url: string }> {
  const stripe = await getStripe();
  const priceId = getStripePriceId(tier);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { tenantId, tier },
    success_url: `https://agentflowai-11dd2.web.app/billing/callback?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: "https://agentflowai-11dd2.web.app/billing?cancelled=true",
  });

  return {
    sessionId: session.id,
    url: session.url || "",
  };
}

export async function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Promise<Stripe.Event> {
  const stripe = await getStripe();
  const webhookSecret = await getSecret("STRIPE_WEBHOOK_SECRET");
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

// Map tiers to Stripe price IDs (these would be created in the Stripe Dashboard)
export function getStripePriceId(tier: "solo" | "team" | "brokerage"): string {
  const priceIds: Record<string, string> = {
    solo: "price_solo_aed_179",
    team: "price_team_aed_499",
    brokerage: "price_brokerage_aed_1299",
  };
  return priceIds[tier] || priceIds.solo;
}
