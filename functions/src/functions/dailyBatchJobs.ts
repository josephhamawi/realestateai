import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { loadTenant } from "../utils/marketConfig";

export const dailyBatchJobs = functions.pubsub
  .schedule("every day 02:00")
  .timeZone("UTC")
  .onRun(async () => {
    const now = Timestamp.now();

    // Get all active/trial tenants
    const allTenants = await db
      .collection("tenants")
      .where("status", "in", ["active", "trial"])
      .get();

    // 1. APPOINTMENT REMINDERS (24-hour)
    const tomorrow = Timestamp.fromMillis(
      Date.now() + 25 * 60 * 60 * 1000
    );

    for (const tenantDoc of allTenants.docs) {
      const tenantId = tenantDoc.id;

      try {
        const upcomingAppts = await db
          .collection(`tenants/${tenantId}/appointments`)
          .where("scheduledAt", "<=", tomorrow)
          .where("scheduledAt", ">", now)
          .where("status", "in", ["scheduled", "confirmed"])
          .get();

        for (const apptDoc of upcomingAppts.docs) {
          const appt = apptDoc.data();

          // Send 24-hour reminder if not already sent
          if (!appt.remindersSent?.twentyFourHour) {
            console.log(
              `Sending 24hr reminder for appointment ${apptDoc.id} to tenant ${tenantId}`
            );
            await apptDoc.ref.update({
              "remindersSent.twentyFourHour": true,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error processing reminders for tenant ${tenantId}:`,
          error
        );
      }
    }

    // 2. MONTHLY USAGE COUNTER RESET
    const today = new Date();
    if (today.getUTCDate() === 1) {
      console.log("Resetting monthly usage counters...");
      const batch = db.batch();
      const tenants = await db.collection("tenants").get();

      for (const doc of tenants.docs) {
        batch.update(doc.ref, {
          "usage.leadsThisMonth": 0,
          "usage.whatsappConversations": 0,
          "usage.aiTokensConsumed": 0,
          "usage.appointmentsBooked": 0,
          "usage.lastResetAt": FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log(`Reset usage for ${tenants.size} tenants`);
    }

    // 3. DUNNING: RETRY FAILED PAYMENTS
    const suspendedTenants = await db
      .collection("tenants")
      .where("status", "==", "suspended")
      .get();

    for (const doc of suspendedTenants.docs) {
      console.log(
        `Suspended tenant ${doc.id} -- consider dunning retry`
      );
      // In production: call payment retry logic here
    }

    // 4. STALE LEAD CLEANUP
    const thirtyDaysAgo = Timestamp.fromMillis(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    for (const tenantDoc of allTenants.docs) {
      try {
        const staleLeads = await db
          .collection(`tenants/${tenantDoc.id}/leads`)
          .where("conversation.lastMessageAt", "<", thirtyDaysAgo)
          .where("status", "not-in", ["closed", "dead"])
          .limit(100)
          .get();

        if (!staleLeads.empty) {
          const batch = db.batch();
          for (const leadDoc of staleLeads.docs) {
            batch.update(leadDoc.ref, {
              "qualification.urgency": "cold",
            });
          }
          await batch.commit();
          console.log(
            `Marked ${staleLeads.size} stale leads as cold for tenant ${tenantDoc.id}`
          );
        }
      } catch (error) {
        console.error(
          `Error cleaning stale leads for ${tenantDoc.id}:`,
          error
        );
      }
    }

    // 5. NDPR DELETION EXECUTION
    try {
      const deletionLogs = await db
        .collection("compliance_log")
        .where("eventType", "==", "deletion_requested")
        .where("timestamp", "<", thirtyDaysAgo)
        .limit(50)
        .get();

      for (const log of deletionLogs.docs) {
        const logData = log.data();
        if (logData.leadId && logData.tenantId) {
          console.log(
            `Auto-executing NDPR deletion for lead ${logData.leadId}`
          );
          // Delete messages
          const messagesSnap = await db
            .collection(
              `tenants/${logData.tenantId}/leads/${logData.leadId}/messages`
            )
            .get();
          const batch = db.batch();
          for (const msgDoc of messagesSnap.docs) {
            batch.delete(msgDoc.ref);
          }
          batch.delete(
            db.doc(
              `tenants/${logData.tenantId}/leads/${logData.leadId}`
            )
          );
          await batch.commit();

          // Log completion
          const completionRef = db.collection("compliance_log").doc();
          await completionRef.set({
            logId: completionRef.id,
            tenantId: logData.tenantId,
            market: logData.market,
            leadId: null,
            eventType: "deletion_completed",
            severity: "info",
            details: {
              description: `Auto-executed NDPR deletion for lead ${logData.leadId}`,
            },
            timestamp: FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error("Error executing NDPR deletions:", error);
    }

    console.log("Daily batch jobs completed.");
  });

// Hourly reminder check for more precise 1-hour reminders
export const hourlyReminderCheck = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const now = Timestamp.now();
    const oneHourOut = Timestamp.fromMillis(
      Date.now() + 75 * 60 * 1000
    );

    const allTenants = await db
      .collection("tenants")
      .where("status", "in", ["active", "trial"])
      .get();

    for (const tenantDoc of allTenants.docs) {
      const tenantId = tenantDoc.id;

      try {
        const soonAppts = await db
          .collection(`tenants/${tenantId}/appointments`)
          .where("scheduledAt", "<=", oneHourOut)
          .where("scheduledAt", ">", now)
          .where("status", "in", ["scheduled", "confirmed"])
          .get();

        for (const apptDoc of soonAppts.docs) {
          const appt = apptDoc.data();

          if (!appt.remindersSent?.oneHour) {
            console.log(
              `Sending 1hr reminder for appointment ${apptDoc.id}`
            );
            await apptDoc.ref.update({
              "remindersSent.oneHour": true,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error processing hourly reminders for ${tenantId}:`,
          error
        );
      }
    }
  });
