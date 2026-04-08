import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { getSecret } from "../config/secrets";
import { loadTenant } from "../utils/marketConfig";
import {
  initializePaystackTransaction,
  verifyPaystackSignature,
  getPaystackAmount,
} from "../services/paystack";
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

    if (tenant.market === "nigeria") {
      const result = await initializePaystackTransaction(
        tenant.agent.email,
        getPaystackAmount(tier),
        { tenantId: tenant.tenantId, tier }
      );
      return {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
      };
    }

    if (tenant.market === "dubai") {
      const result = await createCheckoutSession(
        tenant.tenantId,
        tenant.agent.email,
        tier
      );
      return { sessionId: result.sessionId, url: result.url };
    }

    throw new functions.https.HttpsError(
      "invalid-argument",
      "Unsupported market"
    );
  }
);

// --- Paystack Webhook ---
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const paystackSecret = await getSecret("PAYSTACK_SECRET_KEY");
    const signature = req.headers["x-paystack-signature"] as string;

    if (!verifyPaystackSignature(req.body, signature, paystackSecret)) {
      res.status(401).send("Invalid signature");
      return;
    }

    // Idempotency check
    const eventRef = req.body.data?.reference as string;
    if (eventRef) {
      const existing = await db.doc(`_idempotency/paystack_${eventRef}`).get();
      if (existing.exists) {
        res.status(200).send("Already processed");
        return;
      }
    }

    const event = req.body.event as string;
    const data = req.body.data;

    switch (event) {
      case "charge.success": {
        const tenantId = data?.metadata?.tenantId;
        const tier = data?.metadata?.tier;
        if (tenantId && tier) {
          await activateSubscription(tenantId, "paystack", tier, data);
        }
        break;
      }
      case "invoice.payment_failed": {
        const tenantId = data?.metadata?.tenantId;
        if (tenantId) {
          await handleFailedPayment(tenantId);
        }
        break;
      }
    }

    // Mark as processed
    if (eventRef) {
      await db
        .doc(`_idempotency/paystack_${eventRef}`)
        .set({ processedAt: FieldValue.serverTimestamp() });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.status(500).send("Error");
  }
});

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
  provider: "paystack" | "stripe",
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
      paymentData.subscription_code ||
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
