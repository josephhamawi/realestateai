import axios from "axios";
import { getSecret } from "../config/secrets";
import type { Tenant } from "../types/tenant";
import type { MarketConfig } from "../types/market";
import type { Lead } from "../types/lead";
import type { Message } from "../types/message";

const VYNN_API_URL = "https://vynnai.app/api/query";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type AIProvider = "vynn" | "gemini";

export interface TenantVynnOverride {
  apiKey?: string;
  model?: string;
}

async function resolveProvider(
  tenantVynn?: TenantVynnOverride
): Promise<{ provider: AIProvider; apiKey: string; model: string }> {
  // Prefer tenant-level Vynn key if the tenant configured their own
  if (tenantVynn?.apiKey) {
    return {
      provider: "vynn",
      apiKey: tenantVynn.apiKey,
      model: tenantVynn.model || "auto",
    };
  }

  // Fall back to platform-level Vynn key
  try {
    const vynnKey = await getSecret("vynn.apiKey");
    if (vynnKey) {
      let model = "auto";
      try { model = await getSecret("vynn.model"); } catch { /* use default */ }
      return { provider: "vynn", apiKey: vynnKey, model };
    }
  } catch { /* Vynn not configured */ }

  // Fall back to Gemini
  try {
    const geminiKey = await getSecret("gemini.apiKey");
    if (geminiKey) {
      let model = "gemini-2.5-flash";
      try { model = await getSecret("gemini.model"); } catch { /* use default */ }
      return { provider: "gemini", apiKey: geminiKey, model };
    }
  } catch { /* Gemini not configured */ }

  throw new Error("No AI provider configured. Set Vynn AI or Gemini API key in the admin dashboard.");
}

export function buildSystemPrompt(
  tenant: Tenant,
  marketConfig: MarketConfig,
  lead: Lead,
  feedbackContext?: string
): string {
  const persona = tenant.aiConfig.personaName;
  const agentName = tenant.agent.name;

  let prompt = `You are ${persona}, an AI real estate assistant working for ${agentName}`;
  if (tenant.agent.brokerage) prompt += ` at ${tenant.agent.brokerage}`;
  prompt += `. License: ${tenant.agent.licenseNumber}.\n\n`;

  prompt += `MARKET CONTEXT: Dubai real estate. Currency: AED. Areas: Dubai Marina, Downtown, Palm Jumeirah, JVC, JBR, Arabian Ranches, Business Bay.
CULTURAL: Dubai is multicultural (buyers include Indian, British, Russian, Chinese, Pakistani nationals). Respect prayer times (Friday 12-2 PM). Understand Ramadan sensitivities. Use professional, international English.
PROPERTY: Understand off-plan vs ready, freehold zones, payment plans (50/50, post-handover, construction-linked). Know rental yield ranges (5-8% typical).
COMPLIANCE (RERA): NEVER guarantee returns or specific ROI. Use hedging language ("historically," "typically"). NEVER steer based on nationality. Always include agent's RERA license.
ESCALATION: Flag guaranteed ROI demands, attempts to bypass documentation, suspicious payment routing.\n`;

  prompt += `\nQUALIFICATION GOAL: Through natural conversation, determine: budget range, timeline, property type, desired areas, payment preference, and any market-specific criteria. Score the lead 0-100. When score >= ${tenant.aiConfig.handoffThreshold}, suggest an appointment.`;

  if (tenant.aiConfig.greetingScript) {
    prompt += `\n\nCUSTOM GREETING: ${tenant.aiConfig.greetingScript}`;
  }

  prompt += "\n\nIMPORTANT: Keep responses concise and conversational (under 200 words). Use WhatsApp-appropriate formatting.";

  if (feedbackContext) {
    prompt += `\n\nLEARNING FROM PAST LEADS: ${feedbackContext}`;
  }

  return prompt;
}

export function buildClaudeMessages(
  messages: Message[],
  inboundMessage?: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of messages) {
    if (msg.type === "system") continue;
    const text = msg.content.text || "[media message]";

    if (msg.type === "inbound") {
      claudeMessages.push({ role: "user", content: text });
    } else if (msg.type === "outbound" && msg.senderType === "ai") {
      claudeMessages.push({ role: "assistant", content: text });
    }
  }

  if (inboundMessage) {
    claudeMessages.push({ role: "user", content: inboundMessage });
  }

  return claudeMessages;
}

/**
 * Convert system prompt + message history into a single prompt for Vynn AI.
 */
function buildVynnPrompt(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): string {
  let prompt = `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n[CONVERSATION]\n`;

  for (const msg of messages) {
    const label = msg.role === "user" ? "Lead" : "AI";
    prompt += `${label}: ${msg.content}\n`;
  }

  prompt += "\nAI:";
  return prompt;
}

export async function generateAIResponse(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tenantVynn?: TenantVynnOverride
): Promise<{ text: string; tokensUsed: number }> {
  const { provider, apiKey, model } = await resolveProvider(tenantVynn);

  if (provider === "vynn") {
    try {
      const prompt = buildVynnPrompt(systemPrompt, messages);
      const response = await callVynnWithRetry(apiKey, prompt, model);
      const tokensUsed = Math.ceil((prompt.length + response.length) / 4);
      return { text: response, tokensUsed };
    } catch (vynnError) {
      console.warn("Vynn AI failed, trying Gemini fallback:", (vynnError as Error).message);
      // Try Gemini as fallback
      try {
        const geminiKey = await getSecret("gemini.apiKey");
        if (geminiKey) {
          let geminiModel = "gemini-2.5-flash";
          try { geminiModel = await getSecret("gemini.model"); } catch { /* default */ }
          return callGemini(geminiKey, geminiModel, systemPrompt, messages);
        }
      } catch { /* no Gemini either */ }
      throw vynnError;
    }
  }

  // Gemini primary
  return callGemini(apiKey, model, systemPrompt, messages);
}

async function callVynnWithRetry(
  apiKey: string,
  prompt: string,
  model: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await axios.post(
        VYNN_API_URL,
        { prompt, model },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );

      // Extract response text — handle different response shapes
      const data = res.data;
      if (typeof data === "string") return data;
      if (data.response) return data.response;
      if (data.text) return data.text;
      if (data.content) return data.content;
      if (data.result) return data.result;
      if (data.output) return data.output;
      return JSON.stringify(data);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Call Google Gemini API directly.
 */
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{ text: string; tokensUsed: number }> {
  const contents = [];

  // Add conversation as Gemini format
  for (const msg of messages) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // If no messages, add a placeholder
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(
        `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        },
        { timeout: 30000 }
      );

      const candidate = res.data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || "";
      const usage = res.data.usageMetadata || {};
      const tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

      return { text, tokensUsed };
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("Gemini max retries exceeded");
}

export async function extractEntities(
  conversationText: string
): Promise<Record<string, string | string[]>> {
  const { provider, apiKey, model } = await resolveProvider();

  const extractPrompt = `Extract structured real estate data from this conversation. Return a JSON object with these optional fields: budget (string), timeline (string), propertyType (string), areas (string[]), requirements (string[]). Only include fields you can confidently extract. Return valid JSON only.\n\nConversation:\n${conversationText}\n\nJSON:`;

  try {
    let text: string;
    if (provider === "gemini") {
      const result = await callGemini(apiKey, model, "You extract structured data from conversations. Return only valid JSON.", [{ role: "user", content: extractPrompt }]);
      text = result.text;
    } else {
      text = await callVynnWithRetry(apiKey, extractPrompt, model);
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {};
  } catch {
    return {};
  }
}
