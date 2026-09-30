import { db } from "../config/firebase";
import type { MarketConfig } from "../types/market";
import type { Tenant } from "../types/tenant";

const marketConfigCache: Record<string, { data: MarketConfig; expiresAt: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

export async function loadTenant(tenantId: string): Promise<Tenant> {
  const snap = await db.doc(`tenants/${tenantId}`).get();
  if (!snap.exists) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }
  return snap.data() as Tenant;
}

