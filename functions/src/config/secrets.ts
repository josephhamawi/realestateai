import { db } from "./firebase";

// In-memory cache for platform config
let platformConfigCache: Record<string, unknown> | null = null;
let configCacheExpiry = 0;
const CONFIG_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Load platform API config from Firestore platform_config/apis.
 * This is where the admin dashboard stores API keys.
 */
async function loadPlatformConfig(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (platformConfigCache && now < configCacheExpiry) {
    return platformConfigCache;
  }

  const snap = await db.doc("platform_config/apis").get();
  if (snap.exists) {
    platformConfigCache = snap.data() as Record<string, unknown>;
    configCacheExpiry = now + CONFIG_CACHE_TTL_MS;
    return platformConfigCache;
  }

  return {};
}

/**
 * Get a secret value. Resolution order:
 * 1. Environment variable (for local dev / Cloud Functions env config)
 * 2. Firestore platform_config/apis (set via admin dashboard)
 *
 * The `path` parameter supports dot notation for nested values,
 * e.g. "claude.apiKey" reads platform_config.apis.claude.apiKey
 */
export async function getSecret(name: string): Promise<string> {
  // 1. Check environment variable (uppercased, dots replaced with underscores)
  const envKey = name.replace(/\./g, "_").toUpperCase();
  const envValue = process.env[envKey] || process.env[name];
  if (envValue) return envValue;

  // 2. Check Firestore platform_config
  const config = await loadPlatformConfig();
  const parts = name.split(".");
  let value: unknown = config;
  for (const part of parts) {
    if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Secret "${name}" not found in env vars or platform_config`);
}

/**
 * Get the full WhatsApp config from platform_config.
 */
export async function getWhatsAppConfig(): Promise<{
  appSecret: string;
  verifyToken: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  provider: "meta" | "360dialog" | "baileys";
  d360ApiKey: string;
  baileysGatewayUrl: string;
  gatewaySecret: string;
}> {
  const config = await loadPlatformConfig();
  const wa = (config.whatsapp || {}) as Record<string, string>;
  return {
    appSecret: process.env.WHATSAPP_APP_SECRET || wa.appSecret || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || wa.verifyToken || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || wa.accessToken || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || wa.phoneNumberId || "",
    wabaId: process.env.WHATSAPP_WABA_ID || wa.wabaId || "",
    provider: (process.env.WHATSAPP_PROVIDER || wa.provider || "meta") as
      | "meta"
      | "360dialog"
      | "baileys",
    d360ApiKey: process.env.D360_API_KEY || wa.d360ApiKey || "",
    baileysGatewayUrl:
      process.env.BAILEYS_GATEWAY_URL || wa.baileysGatewayUrl || "",
    gatewaySecret: process.env.BAILEYS_GATEWAY_SECRET || wa.gatewaySecret || "",
  };
}

/**
 * Get Vynn AI config from platform_config.
 */
export async function getVynnConfig(): Promise<{
  apiKey: string;
  model: string;
}> {
  const config = await loadPlatformConfig();
  const vynn = (config.vynn || {}) as Record<string, string>;
  return {
    apiKey: process.env.VYNN_API_KEY || vynn.apiKey || "",
    model: process.env.VYNN_MODEL || vynn.model || "auto",
  };
}

/**
 * Get Telegram Bot config from platform_config.
 */
export async function getTelegramConfig(): Promise<{
  botToken: string;
  botUsername: string;
}> {
  const config = await loadPlatformConfig();
  const tg = (config.telegram || {}) as Record<string, string>;
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || tg.botToken || "",
    botUsername: process.env.TELEGRAM_BOT_USERNAME || tg.botUsername || "",
  };
}

/**
 * Get Stripe config from platform_config.
 */
export async function getStripeConfig(): Promise<{
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}> {
  const config = await loadPlatformConfig();
  const st = (config.stripe || {}) as Record<string, string>;
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || st.secretKey || "",
    publicKey: process.env.STRIPE_PUBLIC_KEY || st.publicKey || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || st.webhookSecret || "",
  };
}

/**
 * Get Google OAuth config from platform_config.
 */
export async function getGoogleOAuthConfig(): Promise<{
  clientId: string;
  clientSecret: string;
}> {
  const config = await loadPlatformConfig();
  const g = (config.google || {}) as Record<string, string>;
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || g.clientId || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || g.clientSecret || "",
  };
}

/**
 * Get Microsoft OAuth config from platform_config.
 */
export async function getMicrosoftOAuthConfig(): Promise<{
  clientId: string;
  clientSecret: string;
}> {
  const config = await loadPlatformConfig();
  const ms = (config.microsoft || {}) as Record<string, string>;
  return {
    clientId: process.env.MS_CLIENT_ID || ms.clientId || "",
    clientSecret: process.env.MS_CLIENT_SECRET || ms.clientSecret || "",
  };
}

/**
 * Invalidate the config cache (call after admin updates config).
 */
export function invalidateConfigCache(): void {
  platformConfigCache = null;
  configCacheExpiry = 0;
}
