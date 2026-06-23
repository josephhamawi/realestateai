import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { loadTenant } from "../utils/marketConfig";
import {
  createCheckoutSession,
  constructWebhookEvent,
} from "../services/stripe";
import { isValidTier } from "../utils/validation";

// --- Payment Initialization (Callable) ---
export const paymentProcessor = functions.https.onCall(
  async (data: { tier: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const { tier } = data;
    if (!isValidTier(tier)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid tier"
      );
    }

    const tenant = await loadTenant(context.auth.uid);

    const result = await createCheckoutSession(
      tenant.tenantId,
      tenant.agent.email,
      tier
    );
    return { sessionId: result.sessionId, url: result.url };
  }
);

// --- Stripe Webhook ---
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const signature = req.headers["stripe-signature"] as string;
    const event = await constructWebhookEvent(req.rawBody, signature);

    // Idempotency check
    const existing = await db
      .doc(`_idempotency/stripe_${event.id}`)
      .get();
    if (existing.exists) {
      res.status(200).send("Already processed");
      return;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
      case "invoice.paid": {
        const metadata = (event.data.object as Record<string, any>)
          .metadata;
        const tenantId = metadata?.tenantId;
        const tier = metadata?.tier;
        if (tenantId && tier) {
          await activateSubscription(
            tenantId,
            "stripe",
            tier,
            event.data.object
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const metadata = (event.data.object as Record<string, any>)
          .metadata;
        if (metadata?.tenantId) {
          await handleFailedPayment(metadata.tenantId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const metadata = (event.data.object as Record<string, any>)
          .metadata;
        if (metadata?.tenantId) {
          await db.doc(`tenants/${metadata.tenantId}`).update({
            status: "cancelled",
            "integrations.payments.subscriptionId": "",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;
      }
    }

    // Mark as processed
    await db
      .doc(`_idempotency/stripe_${event.id}`)
      .set({ processedAt: FieldValue.serverTimestamp() });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(400).send("Webhook error");
  }
});

async function activateSubscription(
  tenantId: string,
  provider: "stripe",
  tier: string,
  paymentData: Record<string, any>
): Promise<void> {
  const periodEnd = Timestamp.fromMillis(
    Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  );

  await db.doc(`tenants/${tenantId}`).update({
    status: "active",
    "integrations.payments.provider": provider,
    "integrations.payments.tier": tier,
    "integrations.payments.subscriptionId":
      paymentData.subscription ||
      paymentData.id ||
      "",
    "integrations.payments.currentPeriodEnd": periodEnd,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function handleFailedPayment(tenantId: string): Promise<void> {
  await db.doc(`tenants/${tenantId}`).update({
    status: "suspended",
    updatedAt: FieldValue.serverTimestamp(),
  });
}
