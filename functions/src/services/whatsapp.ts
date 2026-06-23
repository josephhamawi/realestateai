import axios from "axios";
import * as crypto from "crypto";
import { getWhatsAppConfig } from "../config/secrets";

const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  recipientPhone: string,
  text: string
): Promise<string> {
  const { accessToken } = await getWhatsAppConfig();

  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: text },
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.messages?.[0]?.id || "";
}

export async function sendWhatsAppTemplate(
  phoneNumberId: string,
  recipientPhone: string,
  templateName: string,
  languageCode: string,
  components?: Array<{
    type: string;
    parameters: Array<{ type: string; text: string }>;
  }>
): Promise<string> {
  const { accessToken } = await getWhatsAppConfig();

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (components) {
    (body.template as Record<string, unknown>).components = components;
  }

  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    body,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.messages?.[0]?.id || "";
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !rawBody) return false;
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export function parseMessageContent(message: Record<string, unknown>): {
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  location?: { latitude: number; longitude: number };
} {
  const type = message.type as string;

  switch (type) {
    case "text":
      return {
        text: (message.text as Record<string, string>)?.body || "",
      };
    case "image":
      return {
        mediaUrl: (message.image as Record<string, string>)?.id,
        mediaType: "image",
      };
    case "document":
      return {
        mediaUrl: (message.document as Record<string, string>)?.id,
        mediaType: "document",
      };
    case "video":
      return {
        mediaUrl: (message.video as Record<string, string>)?.id,
        mediaType: "video",
      };
    case "audio":
      return {
        mediaUrl: (message.audio as Record<string, string>)?.id,
        mediaType: "audio",
      };
    case "location": {
      const loc = message.location as Record<string, number>;
      return {
        location: {
          latitude: loc?.latitude || 0,
          longitude: loc?.longitude || 0,
        },
        text: `Location: ${loc?.latitude}, ${loc?.longitude}`,
      };
    }
    default:
      return { text: `[${type} message]` };
  }
}

export async function downloadMedia(
  mediaId: string
): Promise<Buffer> {
  const { accessToken } = await getWhatsAppConfig();

  // Get media URL
  const urlResponse = await axios.get(
    `${GRAPH_API_BASE}/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Download media
  const mediaResponse = await axios.get(urlResponse.data.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: "arraybuffer",
  });

  return Buffer.from(mediaResponse.data);
}
