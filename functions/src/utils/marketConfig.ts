import { db } from "../config/firebase";
import type { MarketConfig } from "../types/market";
import type { Tenant } from "../types/tenant";

const marketConfigCache: Record<string, { data: MarketConfig; expiresAt: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function loadMarketConfig(market: "nigeria" | "dubai"): Promise<MarketConfig> {
  const now = Date.now();
  const cached = marketConfigCache[market];
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const snap = await db.doc(`market_config/${market}`).get();
  if (!snap.exists) {
    throw new Error(`Market config not found for: ${market}`);
  }

  const data = snap.data() as MarketConfig;
  marketConfigCache[market] = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

export async function loadTenant(tenantId: string): Promise<Tenant> {
  const snap = await db.doc(`tenants/${tenantId}`).get();
  if (!snap.exists) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }
  return snap.data() as Tenant;
}

export function getPaymentProvider(market: "nigeria" | "dubai"): "paystack" | "stripe" {
  return market === "nigeria" ? "paystack" : "stripe";
}

export function isLeadLimitReached(tenant: Tenant, marketConfig: MarketConfig): boolean {
  const tier = tenant.integrations.payments?.tier || "solo";
  const tierConfig = marketConfig.subscriptionTiers[tier];
  if (tierConfig.leadsPerMonth === -1) return false; // Unlimited
  return tenant.usage.leadsThisMonth >= tierConfig.leadsPerMonth;
}
