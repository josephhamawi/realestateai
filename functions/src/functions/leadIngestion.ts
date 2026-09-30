import * as functions from "firebase-functions";
import { db, FieldValue } from "../config/firebase";
import { normalizePhone, sanitizeText } from "../utils/validation";
import type { Tenant } from "../types/tenant";

export const leadIngestion = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const source = req.query.source as string;
  const key = req.query.key as string;

  if (!source || !key) {
    res.status(400).json({ error: "Missing source or key parameter" });
    return;
  }

  try {
    // Validate API key -> resolve tenantId
    const tenantsSnap = await db
      .collection("tenants")
      .where(`integrations.crm.webhooks.${source}.apiKey`, "==", key)
      .where(`integrations.crm.webhooks.${source}.enabled`, "==", true)
      .limit(1)
      .get();

    if (tenantsSnap.empty) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    const tenant = tenantsSnap.docs[0].data() as Tenant;
    const tenantId = tenant.tenantId;


    // Normalize payload
    const payload = req.body;
    const normalizedLead = normalizeLeadPayload(source, payload);

    // Duplicate detection by phone
    const existingLeads = await db
      .collection(`tenants/${tenantId}/leads`)
      .where("contact.phone", "==", normalizedLead.contact.phone)
      .limit(1)
      .get();

    if (!existingLeads.empty) {
      // Append inquiry note to existing lead
      const existingLeadRef = existingLeads.docs[0].ref;
      await existingLeadRef.update({
        notes: `New inquiry from ${source}: ${normalizedLead.notes || "No details"}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.status(200).json({
        status: "appended",
        leadId: existingLeads.docs[0].id,
      });
      return;
    }

    // Create new lead
    const leadRef = db.collection(`tenants/${tenantId}/leads`).doc();
    await leadRef.set({
      ...normalizedLead,
      leadId: leadRef.id,
      tenantId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Increment usage counter
    await db.doc(`tenants/${tenantId}`).update({
      "usage.leadsThisMonth": FieldValue.increment(1),
    });

    // Log usage
    const logRef = db.collection("usage_logs").doc();
    await logRef.set({
      logId: logRef.id,
      tenantId,
      market: tenant.market,
      date: new Date().toISOString().split("T")[0],
      type: "lead_created",
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      metadata: { source, leadId: leadRef.id },
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ status: "created", leadId: leadRef.id });
  } catch (error) {
    console.error("Lead ingestion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function normalizeLeadPayload(
  source: string,
  payload: Record<string, unknown>
) {
  const market = "dubai";
  // Normalize different source formats into our universal schema
  const name = sanitizeText(
    (payload.name as string) ||
      (payload.contact_name as string) ||
      (payload.full_name as string) ||
      ""
  );
  const phone = normalizePhone(
    (payload.phone as string) ||
      (payload.mobile as string) ||
      (payload.contact_phone as string) ||
      ""
  );
  const email =
    (payload.email as string) ||
    (payload.contact_email as string) ||
    "";

  return {
    market,
    source,
    status: "new" as const,
    contact: {
      name,
      phone,
      email,
      preferredLanguage: "en",
    },
    propertyInterest: {
      budgetMin: Number(payload.budget_min || payload.budgetMin || 0),
      budgetMax: Number(payload.budget_max || payload.budgetMax || 0),
      currency: "AED" as const,
      timeline: (payload.timeline as string) || "",
      propertyType: (payload.property_type as string) || (payload.propertyType as string) || "",
      desiredAreas: Array.isArray(payload.areas)
        ? payload.areas
        : typeof payload.area === "string"
        ? [payload.area]
        : [],
    },
    qualification: {
      score: 10,
      status: "unqualified" as const,
      urgency: "cold" as const,
      readiness: {
        budgetConfirmed: false,
        timelineConfirmed: false,
        propertyTypeConfirmed: false,
        areaConfirmed: false,
        agentReady: false,
      },
    },
    conversation: {
      threadId: "",
      channel: "manual" as const,
      lastMessageAt: null,
      messageCount: 0,
      aiActive: true,
    },
    notes: (payload.notes as string) || (payload.message as string) || "",
  };
}
