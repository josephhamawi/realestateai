import axios from "axios";
import { getSecret } from "../config/secrets";
import type { Tenant } from "../types/tenant";
import type { MarketConfig } from "../types/market";
import type { Lead } from "../types/lead";
import type { Message } from "../types/message";

const VYNN_API_URL = "https://vynnai.app/api/query";

async function getApiKey(): Promise<string> {
  return getSecret("vynn.apiKey");
}

async function getModel(): Promise<string> {
  try {
    return await getSecret("vynn.model");
  } catch {
    return "auto";
  }
}

export function buildSystemPrompt(
  tenant: Tenant,
  marketConfig: MarketConfig,
  lead: Lead,
  feedbackContext?: string
): string {
  const persona = tenant.aiConfig.personaName;
  const agentName = tenant.agent.name;
  const market = tenant.market;

  let prompt = `You are ${persona}, an AI real estate assistant working for ${agentName}`;
  if (tenant.agent.brokerage) prompt += ` at ${tenant.agent.brokerage}`;
  prompt += `. License: ${tenant.agent.licenseNumber}.\n\n`;

  if (market === "nigeria") {
    prompt += `MARKET CONTEXT: Nigeria real estate. Currency: NGN (\u20A6). Areas: Lagos (Lekki, Ikoyi, Victoria Island, Ajah), Abuja (Maitama, Asokoro, Gwarinpa).
CULTURAL: You understand Nigerian Pidgin English. You know Lagos traffic patterns. You reference infrastructure (road, water, light, security) because it matters. You understand C of O, Governor's Consent, Deed, Survey Plan title types.
PAYMENT: Outright, installment plans, and mortgage are common. Agents often accept payment plans.
COMPLIANCE (NDPR): Always request data processing consent before collecting personal information. Never share property details that could enable fraud.
ESCALATION: Flag "distress sale" language, upfront commission requests, requests for personal bank details, significantly below-market pricing.\n`;
  } else if (market === "dubai") {
    prompt += `MARKET CONTEXT: Dubai real estate. Currency: AED. Areas: Dubai Marina, Downtown, Palm Jumeirah, JVC, JBR, Arabian Ranches, Business Bay.
CULTURAL: Dubai is multicultural -- buyers include Indian, British, Russian, Chinese, Pakistani nationals. Respect prayer times (Friday 12-2 PM). Understand Ramadan sensitivities. Use professional, international English.
PROPERTY: Understand off-plan vs ready, freehold zones, payment plans (50/50, post-handover, construction-linked). Know rental yield ranges (5-8% typical).
COMPLIANCE (RERA): NEVER guarantee returns or specific ROI. Use hedging language ("historically," "typically"). NEVER steer based on nationality. Always include agent's RERA license.
ESCALATION: Flag guaranteed ROI demands, attempts to bypass documentation, suspicious payment routing.\n`;
  }

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
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = await getApiKey();
  const model = await getModel();
  const prompt = buildVynnPrompt(systemPrompt, messages);

  const response = await callVynnWithRetry(apiKey, prompt, model);

  // Estimate tokens (Vynn doesn't return token counts)
  const tokensUsed = Math.ceil((prompt.length + response.length) / 4);

  return { text: response, tokensUsed };
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

export async function extractEntities(
  conversationText: string
): Promise<Record<string, string | string[]>> {
  const apiKey = await getApiKey();
  const model = await getModel();

  const prompt = `Extract structured real estate data from this conversation. Return a JSON object with these optional fields: budget (string), timeline (string), propertyType (string), areas (string[]), requirements (string[]). Only include fields you can confidently extract. Return valid JSON only.\n\nConversation:\n${conversationText}\n\nJSON:`;

  try {
    const text = await callVynnWithRetry(apiKey, prompt, model);
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {};
  } catch {
    return {};
  }
}
