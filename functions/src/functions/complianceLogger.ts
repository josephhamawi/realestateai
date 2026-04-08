import * as functions from "firebase-functions";
import { db, FieldValue, Timestamp } from "../config/firebase";
import { loadTenant } from "../utils/marketConfig";

export const complianceLogger = functions.https.onCall(
  async (
    data: {
      action: string;
      tenantId: string;
      leadId?: string;
      eventData?: Record<string, unknown>;
    },
    context
  ) => {
    const { action, tenantId, leadId, eventData } = data;

    switch (action) {
      case "logEvent": {
        const { eventType, severity, details, messageId } =
          eventData as {
            eventType: string;
            severity: "info" | "warning" | "critical";
            details: { description: string; violationType?: string };
            messageId?: string;
          };

        const tenant = await loadTenant(tenantId);
        const logRef = db.collection("compliance_log").doc();

        await logRef.set({
          logId: logRef.id,
          tenantId,
          market: tenant.market,
          leadId: leadId || null,
          messageId: messageId || null,
          eventType,
          severity,
          details,
          timestamp: FieldValue.serverTimestamp(),
        });

        return { logId: logRef.id };
      }

      case "captureConsent": {
        if (!leadId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "leadId required"
          );
        }

        const { consentGiven, consentText } = eventData as {
          consentGiven: boolean;
          consentText: string;
        };

        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
          "consent.given": consentGiven,
          "consent.timestamp": FieldValue.serverTimestamp(),
          "consent.method": "whatsapp_reply",
          "consent.text": consentText,
        });

        const tenant = await loadTenant(tenantId);
        const logRef = db.collection("compliance_log").doc();
        await logRef.set({
          logId: logRef.id,
          tenantId,
          market: tenant.market,
          leadId,
          eventType: consentGiven ? "consent_captured" : "consent_declined",
          severity: "info",
          details: {
            description: consentGiven
              ? "Lead consented to data processing"
              : "Lead declined data processing",
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true };
      }

      case "requestDeletion": {
        if (!leadId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "leadId required"
          );
        }

        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
          status: "dead",
          notes: "NDPR deletion requested",
          updatedAt: FieldValue.serverTimestamp(),
        });

        const deadline = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const tenant = await loadTenant(tenantId);
        const logRef = db.collection("compliance_log").doc();
        await logRef.set({
          logId: logRef.id,
          tenantId,
          market: tenant.market,
          leadId,
          eventType: "deletion_requested",
          severity: "info",
          details: {
            description: `Deletion requested. Deadline: ${deadline}`,
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true, deadline };
      }

      case "executeDeletion": {
        if (!leadId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "leadId required"
          );
        }

        // Delete all messages
        const messagesSnap = await db
          .collection(
            `tenants/${tenantId}/leads/${leadId}/messages`
          )
          .get();
        const batch = db.batch();
        for (const doc of messagesSnap.docs) {
          batch.delete(doc.ref);
        }

        // Delete lead document
        batch.delete(
          db.doc(`tenants/${tenantId}/leads/${leadId}`)
        );
        await batch.commit();

        // Log completion
        const tenant = await loadTenant(tenantId);
        const logRef = db.collection("compliance_log").doc();
        await logRef.set({
          logId: logRef.id,
          tenantId,
          market: tenant.market,
          leadId: null,
          eventType: "deletion_completed",
          severity: "info",
          details: {
            description: `Lead ${leadId} deleted per NDPR request. No PII retained.`,
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true };
      }

      case "generateReport": {
        const { startDate, endDate } = eventData as {
          startDate: string;
          endDate: string;
        };

        const logsSnap = await db
          .collection("compliance_log")
          .where("tenantId", "==", tenantId)
          .where(
            "timestamp",
            ">=",
            Timestamp.fromDate(new Date(startDate))
          )
          .where(
            "timestamp",
            "<=",
            Timestamp.fromDate(new Date(endDate))
          )
          .orderBy("timestamp", "desc")
          .get();

        const events = logsSnap.docs.map((d) => d.data());

        const summary = {
          totalEvents: events.length,
          bySeverity: {
            info: events.filter((e) => e.severity === "info").length,
            warning: events.filter((e) => e.severity === "warning")
              .length,
            critical: events.filter(
              (e) => e.severity === "critical"
            ).length,
          },
          byType: events.reduce(
            (acc, e) => {
              acc[e.eventType] = (acc[e.eventType] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };

        return { totalEvents: events.length, events, summary };
      }

      default:
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid action"
        );
    }
  }
);
