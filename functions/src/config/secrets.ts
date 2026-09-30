import { randomBytes } from "crypto";
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

export type AIProvider = "anthropic" | "openai" | "gemini";

export interface ResolvedAIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const AI_PROVIDER_DEFAULTS: Record<AIProvider, { model: string; envKey: string; envModel: string }> = {
  anthropic: { model: "claude-opus-5", envKey: "ANTHROPIC_API_KEY", envModel: "ANTHROPIC_MODEL" },
  openai: { model: "gpt-4o", envKey: "OPENAI_API_KEY", envModel: "OPENAI_MODEL" },
  gemini: { model: "gemini-2.5-flash", envKey: "GEMINI_API_KEY", envModel: "GEMINI_MODEL" },
};

/**
 * Resolve the AI provider this instance should use.
 *
 * Resolution order per provider: environment variable, then the key saved from
 * the in-app Setup screen (platform_config/apis.ai.<provider>.apiKey).
 * The provider named in ai.defaultProvider is tried first, then the rest.
 */
export async function getAIConfig(): Promise<ResolvedAIConfig> {
  const config = await loadPlatformConfig();
  const ai = (config.ai || {}) as Record<string, unknown>;

  const preferred = (process.env.AI_PROVIDER ||
    (ai.defaultProvider as string) ||
    "anthropic") as AIProvider;

  const order: AIProvider[] = [preferred, "anthropic", "openai", "gemini"].filter(
    (p, i, arr) => p in AI_PROVIDER_DEFAULTS && arr.indexOf(p) === i
  ) as AIProvider[];

  for (const provider of order) {
    const defaults = AI_PROVIDER_DEFAULTS[provider];
    const saved = (ai[provider] || {}) as Record<string, string>;
    const apiKey = process.env[defaults.envKey] || saved.apiKey || "";
    if (!apiKey) continue;
    return {
      provider,
      apiKey,
      model: process.env[defaults.envModel] || saved.model || defaults.model,
    };
  }

  throw new Error(
    "No AI provider configured. Open Setup in the app and add an Anthropic, OpenAI, or Google Gemini API key."
  );
}

/**
 * Get Telegram Bot config from platform_config.
 */
export async function getTelegramConfig(): Promise<{
  botToken: string;
  botUsername: string;
  webhookSecret: string;
}> {
  const config = await loadPlatformConfig();
  const tg = (config.telegram || {}) as Record<string, string>;
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || tg.botToken || "",
    botUsername: process.env.TELEGRAM_BOT_USERNAME || tg.botUsername || "",
    webhookSecret:
      process.env.TELEGRAM_WEBHOOK_SECRET || tg.webhookSecret || "",
  };
}

/**
 * Return the secret Telegram echoes back on every webhook delivery, creating
 * and storing one on first use. Only letters, digits, underscore and hyphen
 * are allowed by Telegram, and the value is at most 256 characters.
 */
export async function ensureTelegramWebhookSecret(): Promise<string> {
  const existing = await getTelegramConfig();
  if (existing.webhookSecret) return existing.webhookSecret;

  const secret = randomBytes(32).toString("hex");
  await db.doc("platform_config/apis").set(
    { telegram: { webhookSecret: secret } },
    { merge: true }
  );
  invalidateConfigCache();
  return secret;
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
