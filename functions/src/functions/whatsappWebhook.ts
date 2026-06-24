import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { getWhatsAppConfig } from "../config/secrets";
import {
  verifyWebhookSignature,
  parseMessageContent,
  sendWhatsAppMessage,
} from "../services/whatsapp";
import { loadTenant, loadMarketConfig } from "../utils/marketConfig";
import {
  buildSystemPrompt,
  buildClaudeMessages,
  generateAIResponse,
} from "../services/claude";
import { runComplianceCheck } from "../utils/compliance";
import type { Message } from "../types/message";

export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // GET: Meta webhook verification
  if (req.method === "GET") {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    try {
      const { verifyToken } = await getWhatsAppConfig();
      if (mode === "subscribe" && token === verifyToken) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send("Forbidden");
      }
    } catch {
      res.status(500).send("Server error");
    }
    return;
  }

  // POST: Inbound message
  try {
    // Verify signature
    const { appSecret } = await getWhatsAppConfig();
    const signature = req.headers["x-hub-signature-256"] as string;

    if (!verifyWebhookSignature(req.rawBody, signature, appSecret)) {
      res.status(403).send("Invalid signature");
      return;
    }

    const entries = req.body.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;

        if (!phoneNumberId) continue;

        // Resolve tenant from phone number ID
        const mappingSnap = await db
          .doc(`phone_mappings/${phoneNumberId}`)
          .get();
        if (!mappingSnap.exists) continue;

        const { tenantId, market } = mappingSnap.data() as {
          tenantId: string;
          market: string;
        };

        // Process each inbound message
        for (const message of value.messages || []) {
          const senderPhone = message.from as string;
          const contactName =
            value.contacts?.[0]?.profile?.name || "";

          // Parse message content
          const content = parseMessageContent(message);

          // Find or create lead
          const leadId = await findOrCreateLead(
            tenantId,
            market,
            senderPhone,
            contactName
          );

          // Store inbound message
          const msgRef = db
            .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
            .doc();
          await msgRef.set({
            messageId: msgRef.id,
            tenantId,
            leadId,
            type: "inbound",
            channel: "whatsapp",
            senderType: "lead",
            content,
            metadata: {
              aiGenerated: false,
              whatsappMessageId: message.id || "",
            },
            timestamp: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          });

          // Update conversation window
          await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
            "conversation.lastMessageAt": FieldValue.serverTimestamp(),
            "conversation.windowExpiresAt": Timestamp.fromMillis(
              Date.now() + 24 * 60 * 60 * 1000
            ),
            "conversation.messageCount": FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Generate and send the AI reply (Noor)
          try {
            await generateAndSendReply(
              tenantId,
              leadId,
              phoneNumberId,
              senderPhone
            );
          } catch (replyError) {
            console.error("Failed to generate or send AI reply:", replyError);
          }
        }

        // Process delivery status updates
        for (const status of value.statuses || []) {
          await updateDeliveryStatus(tenantId, status);
        }
      }
    }
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
  }

  // Always respond 200 quickly (Meta requirement)
  res.status(200).send("OK");
});

async function generateAndSendReply(
  tenantId: string,
  leadId: string,
  phoneNumberId: string,
  recipientPhone: string
): Promise<void> {
  const [tenant, marketConfig] = await Promise.all([
    loadTenant(tenantId),
    loadMarketConfig(),
  ]);

  const [leadSnap, messagesSnap] = await Promise.all([
    db.doc(`tenants/${tenantId}/leads/${leadId}`).get(),
    db
      .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
      .orderBy("timestamp", "asc")
      .limit(50)
      .get(),
  ]);
  const lead = leadSnap.data();
  if (!lead) return;

  // Respect the per-lead AI toggle
  if (!lead.conversation?.aiActive) return;

  const messages = messagesSnap.docs.map((d) => d.data() as Message);
  const systemPrompt = buildSystemPrompt(
    tenant as any,
    marketConfig,
    lead as any,
    ""
  );
  const claudeMessages = buildClaudeMessages(messages);
  if (claudeMessages.length === 0) return;

  // Prefer the tenant's own Vynn AI key if configured
  const tenantVynn = tenant.integrations?.vynn?.apiKey
    ? {
        apiKey: tenant.integrations.vynn.apiKey,
        model: tenant.integrations.vynn.model,
      }
    : undefined;

  const { text: aiReplyText, tokensUsed } = await generateAIResponse(
    systemPrompt,
    claudeMessages,
    tenantVynn
  );

  const complianceResult = runComplianceCheck(aiReplyText, marketConfig);
  let finalMessage = aiReplyText;

  if (complianceResult.status === "blocked") {
    const constraintPrompt =
      systemPrompt +
      "\n\nCOMPLIANCE ALERT: Your previous response was blocked due to: " +
      complianceResult.violations.join("; ") +
      ". Rewrite your response avoiding these issues.";
    const { text: rewrittenText } = await generateAIResponse(
      constraintPrompt,
      claudeMessages,
      tenantVynn
    );
    finalMessage = rewrittenText;
  }

  // Approval mode: store as pending, do not send
  if (tenant.aiConfig?.approvalMode) {
    const pendingRef = db
      .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
      .doc();
    await pendingRef.set({
      messageId: pendingRef.id,
      tenantId,
      leadId,
      type: "outbound",
      channel: "whatsapp",
      senderType: "ai",
      content: { text: finalMessage },
      metadata: {
        aiGenerated: true,
        aiModel: "vynn-auto",
        tokensUsed,
        complianceCheck: complianceResult.status,
        complianceNotes: complianceResult.notes,
        deliveryStatus: "pending_approval" as any,
      },
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  // Send via WhatsApp and store the outbound message
  const waMessageId = await sendWhatsAppMessage(
    phoneNumberId,
    recipientPhone,
    finalMessage
  );

  const outMsgRef = db
    .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
    .doc();
  await outMsgRef.set({
    messageId: outMsgRef.id,
    tenantId,
    leadId,
    type: "outbound",
    channel: "whatsapp",
    senderType: "ai",
    content: { text: finalMessage },
    metadata: {
      aiGenerated: true,
      aiModel: "vynn-auto",
      tokensUsed,
      complianceCheck: complianceResult.status,
      complianceNotes: complianceResult.notes,
      whatsappMessageId: waMessageId,
      deliveryStatus: "sent",
    },
    timestamp: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function findOrCreateLead(
  tenantId: string,
  market: string,
  phone: string,
  contactName: string
): Promise<string> {
  // Search for existing lead by phone
  const existingLeads = await db
    .collection(`tenants/${tenantId}/leads`)
    .where("contact.phone", "==", phone)
    .limit(1)
    .get();

  if (!existingLeads.empty) {
    return existingLeads.docs[0].id;
  }

  // Create new lead
  const leadRef = db.collection(`tenants/${tenantId}/leads`).doc();
  await leadRef.set({
    leadId: leadRef.id,
    tenantId,
    market,
    source: "whatsapp",
    status: "new",
    contact: {
      name: contactName,
      phone,
      preferredLanguage: "en",
      whatsappProfileName: contactName,
    },
    propertyInterest: {
      budgetMin: 0,
      budgetMax: 0,
      currency: "AED",
      timeline: "",
      propertyType: "",
      desiredAreas: [],
    },
    qualification: {
      score: 0,
      status: "unqualified",
      urgency: "cold",
      readiness: {
        budgetConfirmed: false,
        timelineConfirmed: false,
        propertyTypeConfirmed: false,
        areaConfirmed: false,
        agentReady: false,
      },
    },
    conversation: {
      threadId: leadRef.id,
      channel: "whatsapp",
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: 0,
      aiActive: true,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Increment usage
  await db.doc(`tenants/${tenantId}`).update({
    "usage.leadsThisMonth": FieldValue.increment(1),
  });

  return leadRef.id;
}

async function updateDeliveryStatus(
  tenantId: string,
  status: Record<string, unknown>
): Promise<void> {
  const whatsappMessageId = status.id as string;
  const deliveryStatus = status.status as string;

  if (status.errors) {
    console.error(
      "WhatsApp delivery error:",
      JSON.stringify(status.errors)
    );
  }

  if (!whatsappMessageId || !deliveryStatus) return;

  // Find the message by whatsapp message ID across all leads
  // This is a broad query - in production, consider a separate lookup collection
  try {
    const leadsSnap = await db
      .collection(`tenants/${tenantId}/leads`)
      .limit(50)
      .get();

    for (const leadDoc of leadsSnap.docs) {
      const messagesSnap = await db
        .collection(
          `tenants/${tenantId}/leads/${leadDoc.id}/messages`
        )
        .where("metadata.whatsappMessageId", "==", whatsappMessageId)
        .limit(1)
        .get();

      if (!messagesSnap.empty) {
        // Messages are append-only, so we log status separately
        console.log(
          `Delivery status update: ${whatsappMessageId} -> ${deliveryStatus}`
        );
        break;
      }
    }
  } catch (error) {
    console.error("Failed to update delivery status:", error);
  }
}
