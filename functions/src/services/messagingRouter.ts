import { db } from "../config/firebase";
import { sendWhatsAppMessage } from "./whatsapp";
import { sendTelegramMessage } from "./telegram";
import { getWhatsAppConfig, getTelegramConfig } from "../config/secrets";

type Channel = "whatsapp" | "telegram";

/**
 * Determine which messaging channel to use for a lead.
 *
 * For REPLIES: always use the channel the lead came from (conversation.channel).
 * For NEW outbound: prefer WhatsApp if configured, else Telegram.
 */
async function resolveChannel(
  tenantId: string,
  leadId: string
): Promise<{ channel: Channel; lead: FirebaseFirestore.DocumentData }> {
  const leadSnap = await db.doc(`tenants/${tenantId}/leads/${leadId}`).get();
  if (!leadSnap.exists) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  const lead = leadSnap.data()!;

  // If the lead has a conversation channel, reply on the same channel
  const leadChannel = lead.conversation?.channel as string | undefined;
  if (leadChannel === "telegram" || leadChannel === "whatsapp") {
    return { channel: leadChannel, lead };
  }

  // For new outbound messages, use priority logic
  const waConfig = await getWhatsAppConfig();
  if (waConfig.accessToken && waConfig.phoneNumberId) {
    return { channel: "whatsapp", lead };
  }

  const tgConfig = await getTelegramConfig();
  if (tgConfig.botToken) {
    return { channel: "telegram", lead };
  }

  throw new Error("No messaging channel configured. Set up WhatsApp or Telegram in the admin dashboard.");
}

/**
 * Send a message to a lead via the appropriate channel.
 * Returns the external message ID from the channel provider.
 */
export async function sendMessageToLead(
  tenantId: string,
  leadId: string,
  text: string
): Promise<{ channel: Channel; externalMessageId: string }> {
  const { channel, lead } = await resolveChannel(tenantId, leadId);

  if (channel === "whatsapp") {
    const waConfig = await getWhatsAppConfig();
    const phone = lead.contact?.phone;
    if (!phone) {
      throw new Error("Lead has no phone number for WhatsApp delivery");
    }
    const messageId = await sendWhatsAppMessage(
      waConfig.phoneNumberId,
      phone,
      text
    );
    return { channel: "whatsapp", externalMessageId: messageId };
  }

  if (channel === "telegram") {
    const chatId = lead.contact?.telegramChatId;
    if (!chatId) {
      throw new Error("Lead has no Telegram chat ID for delivery");
    }
    const messageId = await sendTelegramMessage(chatId, text);
    return { channel: "telegram", externalMessageId: String(messageId) };
  }

  throw new Error(`Unsupported channel: ${channel}`);
}
