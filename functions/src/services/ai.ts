import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { getAIConfig, type AIProvider, type ResolvedAIConfig } from "../config/secrets";
import type { Tenant } from "../types/tenant";
import type { MarketConfig } from "../types/market";
import type { Lead } from "../types/lead";
import type { Message } from "../types/message";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface TenantAIOverride {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
}

export type ConversationMessage = { role: "user" | "assistant"; content: string };

/**
 * Resolve which AI provider to use. Tenant-level keys win over the
 * instance-wide keys entered in the Setup screen.
 */
async function resolveProvider(
  tenantAI?: TenantAIOverride
): Promise<ResolvedAIConfig> {
  if (tenantAI?.apiKey && tenantAI.provider) {
    return {
      provider: tenantAI.provider,
      apiKey: tenantAI.apiKey,
      model: tenantAI.model || defaultModelFor(tenantAI.provider),
    };
  }
  return getAIConfig();
}

export function defaultModelFor(provider: AIProvider): string {
  switch (provider) {
    case "anthropic":
      return "claude-opus-5";
    case "openai":
      return "gpt-4o";
    case "gemini":
      return "gemini-2.5-flash";
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

  prompt += "\n\nIMPORTANT: Keep responses concise and conversational (under 200 words). Use chat-appropriate formatting.";

  if (feedbackContext) {
    prompt += `\n\nLEARNING FROM PAST LEADS: ${feedbackContext}`;
  }

  // Market config is loaded for compliance and currency context.
  if (marketConfig?.compliance?.blockedPhrases?.length) {
    prompt += `\n\nNEVER use these phrases: ${marketConfig.compliance.blockedPhrases.join(", ")}.`;
  }

  const interest = lead.propertyInterest;
  if (interest?.budgetMin || interest?.budgetMax) {
    prompt += `\n\nKNOWN SO FAR: budget range ${interest.budgetMin || "?"} to ${interest.budgetMax || "?"} ${interest.currency || ""}.`;
  }

  return prompt;
}

export function buildConversationMessages(
  messages: Message[],
  inboundMessage?: string
): ConversationMessage[] {
  const history: ConversationMessage[] = [];

  for (const msg of messages) {
    if (msg.type === "system") continue;
    const text = msg.content.text || "[media message]";

    if (msg.type === "inbound") {
      history.push({ role: "user", content: text });
    } else if (msg.type === "outbound" && msg.senderType === "ai") {
      history.push({ role: "assistant", content: text });
    }
  }

  if (inboundMessage) {
    history.push({ role: "user", content: inboundMessage });
  }

  return history;
}

export async function generateAIResponse(
  systemPrompt: string,
  messages: ConversationMessage[],
  tenantAI?: TenantAIOverride
): Promise<{ text: string; tokensUsed: number; model: string }> {
  const { provider, apiKey, model } = await resolveProvider(tenantAI);

  switch (provider) {
    case "anthropic":
      return callAnthropic(apiKey, model, systemPrompt, messages);
    case "openai":
      return callOpenAI(apiKey, model, systemPrompt, messages);
    case "gemini":
      return callGemini(apiKey, model, systemPrompt, messages);
  }
}

// --- Anthropic (Claude) ---

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<{ text: string; tokensUsed: number; model: string }> {
  const client = new Anthropic({ apiKey, maxRetries: 2 });

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    // Short conversational replies: skip thinking to keep latency and cost down.
    thinking: { type: "disabled" },
    system: systemPrompt,
    messages: messages.length > 0 ? messages : [{ role: "user", content: "Hello" }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI provider declined to answer this message.");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const tokensUsed =
    (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0);

  return { text, tokensUsed, model };
}

// --- OpenAI ---

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<{ text: string; tokensUsed: number; model: string }> {
  const payload = {
    model,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...(messages.length > 0 ? messages : [{ role: "user", content: "Hello" }]),
    ],
  };

  const res = await withRetry(() =>
    axios.post(OPENAI_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000,
    })
  );

  const text = res.data.choices?.[0]?.message?.content || "";
  const tokensUsed = res.data.usage?.total_tokens || 0;
  return { text, tokensUsed, model };
}

// --- Google Gemini ---

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<{ text: string; tokensUsed: number; model: string }> {
  const contents = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const res = await withRetry(() =>
    axios.post(
      `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
      {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      },
      { timeout: 30000 }
    )
  );

  const candidate = res.data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";
  const usage = res.data.usageMetadata || {};
  const tokensUsed =
    (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

  return { text, tokensUsed, model };
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries - 1) break;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw lastError;
}

export async function extractEntities(
  conversationText: string
): Promise<Record<string, string | string[]>> {
  const extractPrompt = `Extract structured real estate data from this conversation. Return a JSON object with these optional fields: budget (string), timeline (string), propertyType (string), areas (string[]), requirements (string[]). Only include fields you can confidently extract. Return valid JSON only.\n\nConversation:\n${conversationText}\n\nJSON:`;

  try {
    const { text } = await generateAIResponse(
      "You extract structured data from conversations. Return only valid JSON.",
      [{ role: "user", content: extractPrompt }]
    );
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {};
  } catch {
    return {};
  }
}
