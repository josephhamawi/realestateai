import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { getTelegramConfig } from "../config/secrets";
import { sendTelegramMessage, sendTypingAction, sendTelegramDocument } from "../services/telegram";
import { registerWebhook } from "../services/telegram";
import { generateICS } from "../utils/icsGenerator";
import { loadTenant, loadMarketConfig } from "../utils/marketConfig";
import {
  buildSystemPrompt,
  buildClaudeMessages,
  generateAIResponse,
  extractEntities,
} from "../services/claude";
import { createCalendarEvent } from "../services/googleCalendar";
import { createOutlookEvent } from "../services/outlookCalendar";
import { runComplianceCheck } from "../utils/compliance";
import type { Message } from "../types/message";

/**
 * HTTP endpoint that receives Telegram Bot API updates (webhook mode).
 *
 * Telegram sends a JSON body with { update_id, message, ... }.
 * We extract chat.id, text, and from info, find/create a lead,
 * store the inbound message, generate an AI response, and reply.
 */
export const telegramWebhook = functions
  .runWith({ memory: "512MB", timeoutSeconds: 120, minInstances: 1 })
  .https.onRequest(async (req, res) => {
  // Only accept POST
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const update = req.body;

    // We only handle text messages for now
    const message = update.message;
    if (!message || !message.text) {
      // Could be an edit, callback query, etc. Acknowledge and ignore.
      res.status(200).send("OK");
      return;
    }

    const chatId = String(message.chat.id);
    const text = message.text as string;
    const firstName = message.from?.first_name || "";
    const lastName = message.from?.last_name || "";
    const username = message.from?.username || "";
    const contactName = [firstName, lastName].filter(Boolean).join(" ") || username || "Telegram User";

    // Send "typing..." immediately so user sees activity
    sendTypingAction(chatId);

    // Resolve tenant
    const tenantId = await resolveTenantForTelegram();
    if (!tenantId) {
      console.error("No tenant configured for Telegram bot");
      res.status(200).send("OK");
      return;
    }

    // Parallel: load tenant + find/create lead
    const [tenant, leadId] = await Promise.all([
      loadTenant(tenantId),
      findOrCreateTelegramLead(tenantId, "dubai", chatId, contactName, username),
    ]);
    // Now load market config
    const marketConfig = await loadMarketConfig();

    // Store inbound message
    const msgRef = db
      .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
      .doc();
    await msgRef.set({
      messageId: msgRef.id,
      tenantId,
      leadId,
      type: "inbound",
      channel: "telegram",
      senderType: "lead",
      content: { text },
      metadata: {
        aiGenerated: false,
        telegramMessageId: String(message.message_id || ""),
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

    // Parallel: load lead + conversation history
    const [leadSnap, messagesSnap] = await Promise.all([
      db.doc(`tenants/${tenantId}/leads/${leadId}`).get(),
      db.collection(`tenants/${tenantId}/leads/${leadId}/messages`)
        .orderBy("timestamp", "asc")
        .limit(50)
        .get(),
    ]);
    const lead = leadSnap.data()!;
    const messages = messagesSnap.docs.map((d) => d.data() as Message);

    // Check if AI is active for this lead
    if (!lead.conversation?.aiActive) {
      res.status(200).send("OK");
      return;
    }

    // Build AI prompts
    const systemPrompt = buildSystemPrompt(
      tenant as any,
      marketConfig,
      lead as any,
      ""
    );
    const claudeMessages = buildClaudeMessages(messages);

    if (claudeMessages.length === 0) {
      res.status(200).send("OK");
      return;
    }

    // Prefer tenant's own Vynn AI key if configured
    const tenantVynn = tenant.integrations?.vynn?.apiKey
      ? { apiKey: tenant.integrations.vynn.apiKey, model: tenant.integrations.vynn.model }
      : undefined;

    // Generate AI response
    const { text: aiReplyText, tokensUsed } = await generateAIResponse(
      systemPrompt,
      claudeMessages,
      tenantVynn
    );

    // Run compliance check
    const complianceResult = runComplianceCheck(
      aiReplyText,
      marketConfig
    );

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

    // If approval mode, store as pending (don't send yet)
    if (tenant.aiConfig.approvalMode) {
      const pendingRef = db
        .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
        .doc();
      await pendingRef.set({
        messageId: pendingRef.id,
        tenantId,
        leadId,
        type: "outbound",
        channel: "telegram",
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
    } else {
      // Send via Telegram
      try {
        const tgMessageId = await sendTelegramMessage(chatId, finalMessage);

        // Store outbound message
        const outMsgRef = db
          .collection(`tenants/${tenantId}/leads/${leadId}/messages`)
          .doc();
        await outMsgRef.set({
          messageId: outMsgRef.id,
          tenantId,
          leadId,
          type: "outbound",
          channel: "telegram",
          senderType: "ai",
          content: { text: finalMessage },
          metadata: {
            aiGenerated: true,
            aiModel: "vynn-auto",
            tokensUsed,
            complianceCheck: complianceResult.status,
            complianceNotes: complianceResult.notes,
            telegramMessageId: String(tgMessageId),
            deliveryStatus: "sent",
          },
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (sendError) {
        console.error("Failed to send Telegram message:", sendError);
      }
    }

    // --- Post-response processing: entity extraction & appointment detection ---

    // Entity extraction (non-blocking, failures won't break main flow)
    try {
      const allMessages = messagesSnap.docs.map((d) => d.data() as Message);
      const conversationText = allMessages
        .map((m) => {
          const role = m.type === "inbound" ? "Lead" : "AI";
          return `${role}: ${m.content.text || ""}`;
        })
        .join("\n") + `\nAI: ${finalMessage}`;

      const entities = await extractEntities(conversationText);
      const leadUpdate: Record<string, unknown> = {};

      // Parse budget string into min/max numbers
      if (entities.budget && typeof entities.budget === "string") {
        const nums = entities.budget.match(/[\d,]+/g);
        if (nums && nums.length > 0) {
          const parsed = nums.map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => !isNaN(n));
          if (parsed.length >= 2) {
            leadUpdate["propertyInterest.budgetMin"] = Math.min(...parsed);
            leadUpdate["propertyInterest.budgetMax"] = Math.max(...parsed);
          } else if (parsed.length === 1) {
            // Single number: use as both min and max (or estimate a range)
            leadUpdate["propertyInterest.budgetMin"] = Math.floor(parsed[0] * 0.9);
            leadUpdate["propertyInterest.budgetMax"] = parsed[0];
          }
        }
      }

      if (entities.timeline && typeof entities.timeline === "string") {
        leadUpdate["propertyInterest.timeline"] = entities.timeline;
      }

      if (entities.propertyType && typeof entities.propertyType === "string") {
        leadUpdate["propertyInterest.propertyType"] = entities.propertyType;
      }

      if (entities.areas && Array.isArray(entities.areas) && entities.areas.length > 0) {
        leadUpdate["propertyInterest.desiredAreas"] = entities.areas;
      }

      // Extract phone from conversation text (simple regex)
      const phoneMatch = conversationText.match(/(?:phone|number|call me|reach me|whatsapp)[:\s]*([+\d][\d\s\-()]{7,15})/i)
        || conversationText.match(/\b((?:\+?971|05)\d[\d\s\-]{7,11})\b/); // UAE numbers
      if (phoneMatch && !lead.contact.phone) {
        const phone = phoneMatch[1].replace(/[\s\-()]/g, "");
        leadUpdate["contact.phone"] = phone;
      }

      // Extract name if the lead gave a fuller name than Telegram default
      const nameMatch = conversationText.match(/(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/i);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        if (extractedName.length > (lead.contact.name || "").length) {
          leadUpdate["contact.name"] = extractedName;
        }
      }

      // Calculate qualification score based on filled fields
      let score = 0;
      const hasBudget = leadUpdate["propertyInterest.budgetMin"] || lead.propertyInterest?.budgetMin;
      const hasTimeline = leadUpdate["propertyInterest.timeline"] || lead.propertyInterest?.timeline;
      const hasAreas = leadUpdate["propertyInterest.desiredAreas"]
        || (lead.propertyInterest?.desiredAreas && lead.propertyInterest.desiredAreas.length > 0);
      const hasPropertyType = leadUpdate["propertyInterest.propertyType"] || lead.propertyInterest?.propertyType;
      const hasPhone = leadUpdate["contact.phone"] || lead.contact?.phone;
      const hasName = leadUpdate["contact.name"] || (lead.contact?.name && lead.contact.name !== "Telegram User");

      if (hasBudget) score += 20;
      if (hasTimeline) score += 20;
      if (hasAreas) score += 15;
      if (hasPropertyType) score += 15;
      if (hasPhone) score += 15;
      if (hasName) score += 15;

      leadUpdate["qualification.score"] = score;
      leadUpdate["qualification.urgency"] = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
      if (score >= 70) {
        leadUpdate["qualification.status"] = "qualified";
      } else if (score > 0) {
        leadUpdate["qualification.status"] = "qualifying";
      }

      // Update readiness flags
      if (hasBudget) leadUpdate["qualification.readiness.budgetConfirmed"] = true;
      if (hasTimeline) leadUpdate["qualification.readiness.timelineConfirmed"] = true;
      if (hasPropertyType) leadUpdate["qualification.readiness.propertyTypeConfirmed"] = true;
      if (hasAreas) leadUpdate["qualification.readiness.areaConfirmed"] = true;

      if (Object.keys(leadUpdate).length > 0) {
        leadUpdate["updatedAt"] = FieldValue.serverTimestamp();
        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update(leadUpdate);
      }
    } catch (extractionError) {
      console.error("Entity extraction failed (non-critical):", extractionError);
    }

    // Appointment detection (non-blocking)
    try {
      const appointmentPatterns = /\b(confirmed|scheduled|booked|appointment set|see you on|saturday at|sunday at|am is confirmed|pm is confirmed)\b/i;
      if (appointmentPatterns.test(finalMessage)) {
        const scheduledAt = parseAppointmentDate(finalMessage);

        const apptRef = db.collection(`tenants/${tenantId}/appointments`).doc();
        await apptRef.set({
          appointmentId: apptRef.id,
          tenantId,
          leadId,
          market: lead.market || "dubai",
          scheduledAt: Timestamp.fromDate(scheduledAt),
          status: "scheduled",
          type: "property_viewing",
          duration: 60,
          timezone: "Asia/Dubai",
          leadName: lead.contact?.name || contactName,
          source: "ai_booked",
          remindersSent: { twentyFourHour: false, oneHour: false },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update lead status and link appointment
        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
          status: "appointment_set",
          "appointment.appointmentId": apptRef.id,
          "appointment.scheduledAt": Timestamp.fromDate(scheduledAt),
          "appointment.status": "scheduled",
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Appointment created for lead ${leadId}: ${apptRef.id}`);

        // Sync to Google Calendar if connected (non-blocking)
        if (tenant.integrations?.calendar?.google?.connected) {
          try {
            const eventId = await createCalendarEvent(tenantId, {
              scheduledAt,
              leadName: lead.contact?.name || contactName,
              leadPhone: lead.contact?.phone,
              propertyType: lead.propertyInterest?.propertyType,
              duration: 60,
              timezone: "Asia/Dubai",
            });
            if (eventId) {
              await apptRef.update({
                calendarEventId: eventId,
                calendarProvider: "google",
              });
              console.log(`Google Calendar event created: ${eventId}`);
            }
          } catch (calErr) {
            console.error("Calendar event creation failed (non-critical):", calErr);
          }
        }

        // Sync to Outlook Calendar if connected (non-blocking)
        if (tenant.integrations?.calendar?.outlook?.connected) {
          try {
            const outlookEventId = await createOutlookEvent(tenantId, {
              scheduledAt,
              leadName: lead.contact?.name || contactName,
              leadPhone: lead.contact?.phone,
              propertyType: lead.propertyInterest?.propertyType,
              duration: 60,
              timezone: "Asia/Dubai",
            });
            if (outlookEventId) {
              await apptRef.update({
                outlookCalendarEventId: outlookEventId,
                outlookCalendarProvider: "outlook",
              });
              console.log(`Outlook Calendar event created: ${outlookEventId}`);
            }
          } catch (outlookErr) {
            console.error("Outlook calendar event creation failed (non-critical):", outlookErr);
          }
        }

        // Generate ICS calendar invite and send to lead via Telegram
        try {
          const agentName = tenant.agent?.name || "Agent";
          const agentPhone = tenant.agent?.phone || "";
          const agentEmail = tenant.agent?.email || "";
          const brokerage = tenant.agent?.brokerage || "";
          const leadName = lead.contact?.name || contactName;

          const icsContent = generateICS({
            title: `Property Viewing with ${agentName}`,
            description: [
              "Property viewing appointment booked via AgentFlow AI.",
              "",
              `Agent: ${agentName}`,
              agentPhone ? `Phone: ${agentPhone}` : "",
              brokerage ? `Brokerage: ${brokerage}` : "",
            ].filter(Boolean).join("\n"),
            startTime: scheduledAt,
            durationMinutes: 60,
            organizerName: agentName,
            organizerEmail: agentEmail,
            attendeeName: leadName,
          });

          // Format the date/time for the confirmation message
          const apptDate = scheduledAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const apptTime = scheduledAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          // Send confirmation text message
          const confirmationLines = [
            `Your property viewing is confirmed!`,
            ``,
            `Date: ${apptDate}`,
            `Time: ${apptTime}`,
            `Agent: ${agentName}`,
          ];
          if (agentPhone) confirmationLines.push(`Phone: ${agentPhone}`);
          confirmationLines.push(
            ``,
            `A calendar invite is attached below.`
          );

          await sendTelegramMessage(chatId, confirmationLines.join("\n"));

          // Send ICS file as a Telegram document
          await sendTelegramDocument(
            chatId,
            Buffer.from(icsContent),
            "appointment.ics",
            "Tap the file above to add this appointment to your calendar (Apple Calendar, Google Calendar, Outlook, etc.)"
          );

          // Store ICS data on the appointment doc for agent dashboard access
          await apptRef.update({ icsData: icsContent });

          console.log(`ICS calendar invite sent to lead ${leadId} in chat ${chatId}`);
        } catch (icsErr) {
          console.error("ICS send failed (non-critical):", icsErr);
        }
      }
    } catch (appointmentError) {
      console.error("Appointment detection failed (non-critical):", appointmentError);
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
  } catch (error) {
    console.error("Telegram webhook error:", error);
  }

  // Always respond 200 quickly (Telegram requirement)
  res.status(200).send("OK");
});

/**
 * Callable function to register the Telegram webhook URL with Telegram's API.
 * Call this after saving the bot token in admin.
 */
export const registerTelegramWebhook = functions.https.onCall(async () => {
  const { botToken } = await getTelegramConfig();
  if (!botToken) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Telegram bot token not configured. Set it in the Admin dashboard first."
    );
  }

  const webhookUrl =
    "https://us-central1-agentflowai-11dd2.cloudfunctions.net/telegramWebhook";

  const success = await registerWebhook(botToken, webhookUrl);
  if (!success) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to register webhook with Telegram API"
    );
  }

  return { status: "ok", webhookUrl };
});

/**
 * Resolve which tenant should handle Telegram messages.
 * MVP: find the first tenant that has Telegram enabled,
 * or fall back to the first tenant in the system.
 */
async function resolveTenantForTelegram(): Promise<string | null> {
  // First try to find a tenant with Telegram explicitly enabled
  const enabledSnap = await db
    .collection("tenants")
    .where("integrations.telegram.enabled", "==", true)
    .limit(1)
    .get();

  if (!enabledSnap.empty) {
    return enabledSnap.docs[0].id;
  }

  // Fallback: find the most recently created active tenant
  // (the real user, not leftover test accounts)
  const fallbackSnap = await db
    .collection("tenants")
    .where("status", "in", ["active", "trial"])
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!fallbackSnap.empty) {
    return fallbackSnap.docs[0].id;
  }

  return null;
}

/**
 * Parse an appointment date/time from AI response text.
 * Best-effort extraction, defaults to next occurrence of the day mentioned.
 */
function parseAppointmentDate(text: string): Date {
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  // Try to extract time (e.g., "10 AM", "2:30 PM", "14:00")
  let hours = 10; // default to 10 AM
  let minutes = 0;
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (timeMatch[3].toLowerCase() === "pm" && hours < 12) hours += 12;
    if (timeMatch[3].toLowerCase() === "am" && hours === 12) hours = 0;
  } else {
    // Check for "afternoon" / "morning" / "evening"
    if (/afternoon/i.test(text)) hours = 14;
    else if (/evening/i.test(text)) hours = 17;
    else if (/morning/i.test(text)) hours = 10;
  }

  // Try to find a day of week
  const lowerText = text.toLowerCase();
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerText.includes(dayNames[i])) {
      const target = new Date(now);
      const currentDay = now.getDay();
      let daysAhead = i - currentDay;
      if (daysAhead <= 0) daysAhead += 7; // next week if today or past
      target.setDate(now.getDate() + daysAhead);
      target.setHours(hours, minutes, 0, 0);
      return target;
    }
  }

  // Check for "tomorrow"
  if (/tomorrow/i.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  // Check for "today"
  if (/today/i.test(text)) {
    const today = new Date(now);
    today.setHours(hours, minutes, 0, 0);
    return today;
  }

  // Try to parse an explicit date (e.g., "April 15", "15/04", "2026-04-15")
  const explicitDateMatch = text.match(/(\w+ \d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)/i);
  if (explicitDateMatch) {
    const parsed = new Date(explicitDateMatch[1]);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(hours, minutes, 0, 0);
      return parsed;
    }
  }

  // Fallback: next Saturday at the detected time
  const fallback = new Date(now);
  const currentDay = now.getDay();
  const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
  fallback.setDate(now.getDate() + daysUntilSaturday);
  fallback.setHours(hours, minutes, 0, 0);
  return fallback;
}

/**
 * Find an existing lead by Telegram chatId, or create a new one.
 */
async function findOrCreateTelegramLead(
  tenantId: string,
  market: string,
  chatId: string,
  contactName: string,
  username: string
): Promise<string> {
  // Search for existing lead by Telegram chat ID
  const existingLeads = await db
    .collection(`tenants/${tenantId}/leads`)
    .where("contact.telegramChatId", "==", chatId)
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
    source: "telegram",
    status: "new",
    contact: {
      name: contactName,
      phone: "",
      preferredLanguage: "en",
      telegramChatId: chatId,
      telegramUsername: username,
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
      channel: "telegram",
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
