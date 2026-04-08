import axios from "axios";
import { getTelegramConfig } from "../config/secrets";

function buildApiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

/**
 * Send "typing..." indicator so the user sees activity immediately.
 */
export async function sendTypingAction(chatId: string): Promise<void> {
  const { botToken } = await getTelegramConfig();
  if (!botToken) return;
  try {
    await axios.post(buildApiUrl(botToken, "sendChatAction"), {
      chat_id: chatId,
      action: "typing",
    });
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Send a text message via Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<number> {
  const { botToken } = await getTelegramConfig();
  if (!botToken) {
    throw new Error("Telegram bot token not configured");
  }

  const response = await axios.post(buildApiUrl(botToken, "sendMessage"), {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  });

  return response.data.result?.message_id || 0;
}

/**
 * Send a photo with optional caption via Telegram Bot API.
 */
export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string
): Promise<number> {
  const { botToken } = await getTelegramConfig();
  if (!botToken) {
    throw new Error("Telegram bot token not configured");
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    photo: photoUrl,
  };

  if (caption) {
    body.caption = caption;
    body.parse_mode = "Markdown";
  }

  const response = await axios.post(buildApiUrl(botToken, "sendPhoto"), body);

  return response.data.result?.message_id || 0;
}

/**
 * Register a webhook URL with the Telegram Bot API.
 */
export async function registerWebhook(
  botToken: string,
  webhookUrl: string
): Promise<boolean> {
  const response = await axios.post(
    buildApiUrl(botToken, "setWebhook"),
    { url: webhookUrl }
  );

  return response.data.ok === true;
}

/**
 * Remove the webhook (for cleanup/debugging).
 */
export async function removeWebhook(botToken: string): Promise<boolean> {
  const response = await axios.post(
    buildApiUrl(botToken, "deleteWebhook")
  );

  return response.data.ok === true;
}
