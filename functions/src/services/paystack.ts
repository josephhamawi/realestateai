import axios from "axios";
import * as crypto from "crypto";
import { getSecret } from "../config/secrets";

const PAYSTACK_BASE = "https://api.paystack.co";

export async function initializePaystackTransaction(
  email: string,
  amountKobo: number,
  metadata: Record<string, string>
): Promise<{ authorizationUrl: string; reference: string }> {
  const secretKey = await getSecret("PAYSTACK_SECRET_KEY");

  const response = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount: amountKobo,
      currency: "NGN",
      channels: ["card", "bank", "ussd", "qr", "mobile_money"],
      metadata,
      callback_url: "https://agentflowai-11dd2.web.app/billing/callback",
    },
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  return {
    authorizationUrl: response.data.data.authorization_url,
    reference: response.data.data.reference,
  };
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<{
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}> {
  const secretKey = await getSecret("PAYSTACK_SECRET_KEY");

  const response = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  return {
    status: response.data.data.status,
    amount: response.data.data.amount,
    currency: response.data.data.currency,
    metadata: response.data.data.metadata,
  };
}

export function verifyPaystackSignature(
  body: unknown,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(body))
    .digest("hex");
  return hash === signature;
}

// Subscription tier to kobo amounts (Nigeria)
export function getPaystackAmount(tier: "solo" | "team" | "brokerage"): number {
  const prices: Record<string, number> = {
    solo: 25000 * 100,      // 25,000 NGN in kobo
    team: 75000 * 100,      // 75,000 NGN
    brokerage: 200000 * 100, // 200,000 NGN
  };
  return prices[tier] || prices.solo;
}
