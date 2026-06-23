import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { getWhatsAppConfig } from "../config/secrets";
import {
  verifyWebhookSignature,
  parseMessageContent,
} from "../services/whatsapp";

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
