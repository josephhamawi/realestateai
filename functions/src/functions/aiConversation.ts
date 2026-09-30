import * as functions from "firebase-functions";
import { db, FieldValue } from "../config/firebase";
import { loadTenant, loadMarketConfig } from "../utils/marketConfig";
import {
  buildSystemPrompt,
  buildConversationMessages,
  generateAIResponse,
} from "../services/ai";
import { runComplianceCheck } from "../utils/compliance";
import { sendWhatsAppMessage } from "../services/whatsapp";
import { sendMessageToLead } from "../services/messagingRouter";
import type { Message } from "../types/message";
import { requireTenantAccess } from "../utils/auth";

export const aiConversation = functions.https.onCall(
  async (
    data: { tenantId: string; leadId: string; inboundMessage?: string },
    context
  ) => {
    const { tenantId, leadId, inboundMessage } = data;

    // Callable endpoints are public: verify the caller owns this tenant before
    // touching its leads, spending its AI credits, or messaging its contacts.
    requireTenantAccess(context, tenantId);

    // Load tenant and market config
    const tenant = await loadTenant(tenantId);
    const marketConfig = await loadMarketConfig();

    // Load lead
    const leadSnap = await db
      .doc(`tenants/${tenantId}/leads/${leadId}`)
      .get();
    if (!leadSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Lead not found");
    }
    const lead = leadSnap.data()!;

    // Check if AI is active for this lead
    if (!lead.conversation?.aiActive) {
      return { status: "ai_paused" };
    }

    // Load conversation history
    const messagesSnap = await db
      .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
      .orderBy("timestamp", "asc")
      .limit(50)
      .get();
    const messages = messagesSnap.docs.map(
      (d) => d.data() as Message
    );

    // Build AI prompts
    const systemPrompt = buildSystemPrompt(
      tenant as any,
      marketConfig,
      lead as any
    );
    const aiMessages = buildConversationMessages(
      messages,
      inboundMessage
    );

    if (aiMessages.length === 0) {
      return { status: "no_messages" };
    }

    // Prefer the tenant's own AI key if they configured one
    const tenantAI = tenant.integrations?.ai?.apiKey
      ? {
          provider: tenant.integrations.ai.provider,
          apiKey: tenant.integrations.ai.apiKey,
          model: tenant.integrations.ai.model,
        }
      : undefined;

    // Generate AI response
    const { text: aiReplyText, tokensUsed, model: aiModel } =
      await generateAIResponse(systemPrompt, aiMessages, tenantAI);

    // Run compliance check
    const complianceResult = runComplianceCheck(
      aiReplyText,
      marketConfig
    );

    let finalMessage = aiReplyText;

    if (complianceResult.status === "blocked") {
      // Regenerate with compliance constraints
      const constraintPrompt =
        systemPrompt +
        "\n\nCOMPLIANCE ALERT: Your previous response was blocked due to: " +
        complianceResult.violations.join("; ") +
        ". Rewrite your response avoiding these issues.";

      const { text: rewrittenText } = await generateAIResponse(
        constraintPrompt,
        aiMessages,
        tenantAI
      );
      finalMessage = rewrittenText;
    }

    // Determine the lead's channel for message storage
    const leadChannel = lead.conversation?.channel || "whatsapp";

    // If approval mode, store as pending
    if (tenant.aiConfig.approvalMode) {
      const pendingRef = db
        .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
        .doc();
      await pendingRef.set({
        messageId: pendingRef.id,
        tenantId,
        leadId,
        type: "outbound",
        channel: leadChannel,
        senderType: "ai",
        content: { text: finalMessage },
        metadata: {
          aiGenerated: true,
          aiModel,
          tokensUsed,
          complianceCheck: complianceResult.status,
          complianceNotes: complianceResult.notes,
          deliveryStatus: "pending_approval" as any,
        },
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });

      return { status: "pending_approval", tokensUsed };
    }

    // Send via the appropriate channel (WhatsApp, Telegram, etc.)
    try {
      const { channel, externalMessageId } = await sendMessageToLead(
        tenantId,
        leadId,
        finalMessage
      );

      // Build channel-specific metadata
      const channelMeta: Record<string, unknown> = {
        aiGenerated: true,
        aiModel,
        tokensUsed,
        complianceCheck: complianceResult.status,
        complianceNotes: complianceResult.notes,
        deliveryStatus: "sent",
      };
      if (channel === "whatsapp") {
        channelMeta.whatsappMessageId = externalMessageId;
      } else if (channel === "telegram") {
        channelMeta.telegramMessageId = externalMessageId;
      }

      // Store outbound message
      const msgRef = db
        .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
        .doc();
      await msgRef.set({
        messageId: msgRef.id,
        tenantId,
        leadId,
        type: "outbound",
        channel,
        senderType: "ai",
        content: { text: finalMessage },
        metadata: channelMeta,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }

    // Update tenant usage
    await db.doc(`tenants/${tenantId}`).update({
      "usage.aiTokensConsumed": FieldValue.increment(tokensUsed),
    });

    // Log compliance event if flagged
    if (complianceResult.status !== "passed") {
      const logRef = db.collection("compliance_log").doc();
      await logRef.set({
        logId: logRef.id,
        tenantId,
        market: tenant.market,
        leadId,
        eventType:
          complianceResult.status === "blocked"
            ? "rera_check_blocked"
            : "rera_check_flagged",
        severity:
          complianceResult.status === "blocked" ? "warning" : "info",
        details: {
          description: complianceResult.notes,
          violationType: complianceResult.violations[0] || "",
        },
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    return { status: "sent", tokensUsed };
  }
);
