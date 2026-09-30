/**
 * Seed demo leads, conversations, and appointments so a fresh install is not
 * an empty dashboard.
 *
 * Against the emulators (default):
 *   npm run emulators          # in another terminal
 *   node tools/seed-demo.mjs your@email.com
 *
 * Against a real project (careful: this writes real data):
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project SEED_TARGET=production \
 *   node tools/seed-demo.mjs your@email.com
 *
 * The email must belong to an account that already signed up, because leads are
 * written under that account's tenant.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const admin = require("../functions/node_modules/firebase-admin");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node tools/seed-demo.mjs <account-email>");
  process.exit(1);
}

const useEmulator = process.env.SEED_TARGET !== "production";
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  "demo-realestateai";

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  admin.initializeApp({ projectId });
  console.log(`Seeding emulator project "${projectId}"`);
} else {
  admin.initializeApp();
  console.log(`Seeding LIVE project "${projectId}"`);
}

const db = admin.firestore();
const { Timestamp, FieldValue } = admin.firestore;

function daysFromNow(days, hour = 11) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function minutesAgo(minutes) {
  return Timestamp.fromDate(new Date(Date.now() - minutes * 60 * 1000));
}

const LEADS = [
  {
    id: "demo-lead-aisha",
    name: "Aisha Rahman",
    phone: "+971501112233",
    channel: "whatsapp",
    status: "qualified",
    urgency: "hot",
    score: 88,
    source: "whatsapp",
    budgetMin: 1800000,
    budgetMax: 2200000,
    timeline: "1-3 months",
    propertyType: "apartment",
    areas: ["Dubai Marina", "JBR"],
    summary:
      "Cash buyer, 2-bed sea view in Marina or JBR, freehold only, viewing this week.",
    messages: [
      ["inbound", "Hi, I saw your listing. Looking for a 2-bed in Dubai Marina, budget around AED 2M.", 240],
      ["outbound", "Welcome! I'm Noor. A 2-bed in Marina at AED 2M gives you good options. Is this for your own use or investment, and do you need freehold ownership?", 238],
      ["inbound", "Own use. Freehold yes. Sea view if possible.", 232],
      ["outbound", "Noted: freehold, sea view, own use. Are you financing through a mortgage, or is this a cash purchase?", 231],
      ["inbound", "Cash. I want to move within 2 months.", 226],
      ["outbound", "That timeline is workable. I have four RERA-registered freehold options with sea views between AED 1.8M and 2.1M. Historically these hold 5 to 6 percent rental yield, though returns are never guaranteed. Shall I book a viewing on Wednesday at 11am?", 224],
      ["inbound", "Wednesday 11am works.", 220],
    ],
  },
  {
    id: "demo-lead-daniel",
    name: "Daniel Okoro",
    phone: "+971502223344",
    channel: "telegram",
    status: "qualifying",
    urgency: "warm",
    score: 62,
    source: "telegram",
    budgetMin: 900000,
    budgetMax: 1200000,
    timeline: "3-6 months",
    propertyType: "studio",
    areas: ["JVC", "Business Bay"],
    summary: "Investor comparing JVC and Business Bay studios, wants yield numbers.",
    messages: [
      ["inbound", "What can I get for 1 million in JVC?", 90],
      ["outbound", "At AED 1M in JVC you are typically looking at a large studio or a small one-bed, often off-plan with a payment plan. Is this an investment purchase or for living in?", 88],
      ["inbound", "Investment. What yields do these usually see?", 84],
      ["outbound", "JVC studios have typically ranged around 6 to 8 percent gross historically, but that varies by building and service charges and is not a guarantee. Would you like me to compare two specific buildings, and are you open to off-plan with a post-handover plan?", 82],
    ],
  },
  {
    id: "demo-lead-marina",
    name: "Marina Petrova",
    phone: "+971503334455",
    channel: "whatsapp",
    status: "appointment_set",
    urgency: "hot",
    score: 91,
    source: "property_finder",
    budgetMin: 4500000,
    budgetMax: 6000000,
    timeline: "Immediate",
    propertyType: "villa",
    areas: ["Palm Jumeirah", "Dubai Hills"],
    summary: "Relocating family, 4-bed villa, school proximity matters, viewing booked.",
    messages: [
      ["inbound", "We are relocating from Moscow in March and need a 4-bed villa.", 2880],
      ["outbound", "Welcome to Dubai. For a March move with a 4-bed villa, Dubai Hills and Palm Jumeirah are both strong options. What budget range should I work with, and do you need to be near a specific school?", 2875],
      ["inbound", "Up to 6 million. Near GEMS Wellington ideally.", 2870],
      ["outbound", "Dubai Hills fits that well and sits close to GEMS Wellington. I have three 4-bed villas between AED 4.8M and 5.9M. I have put a viewing in for Saturday at 10am with our RERA-certified agent.", 2866],
    ],
  },
  {
    id: "demo-lead-hassan",
    name: "Hassan Al Mansoori",
    phone: "+971504445566",
    channel: "telegram",
    status: "new",
    urgency: "cold",
    score: 24,
    source: "referral",
    budgetMin: 0,
    budgetMax: 0,
    timeline: "Just browsing",
    propertyType: "",
    areas: [],
    summary: "Early stage, no budget confirmed yet.",
    messages: [
      ["inbound", "Just looking around for now, what areas are good?", 30],
      ["outbound", "Happy to help. Are you thinking of living in the property or renting it out? That changes which communities make sense.", 29],
    ],
  },
];

async function main() {
  const user = await admin.auth().getUserByEmail(email);
  const tenantId = user.uid;

  const tenantRef = db.doc(`tenants/${tenantId}`);
  if (!(await tenantRef.get()).exists) {
    console.error(
      `No tenant document for ${email}. Sign up in the app first, then re-run this.`
    );
    process.exit(1);
  }

  for (const lead of LEADS) {
    const leadRef = tenantRef.collection("leads").doc(lead.id);
    await leadRef.set({
      leadId: lead.id,
      tenantId,
      market: "dubai",
      contact: {
        name: lead.name,
        phone: lead.phone,
        preferredLanguage: "en",
      },
      propertyInterest: {
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax,
        currency: "AED",
        timeline: lead.timeline,
        propertyType: lead.propertyType,
        desiredAreas: lead.areas,
      },
      qualification: {
        score: lead.score,
        status: lead.status === "new" ? "qualifying" : "qualified",
        urgency: lead.urgency,
        readiness: {
          budgetConfirmed: lead.budgetMax > 0,
          timelineConfirmed: Boolean(lead.timeline),
          propertyTypeConfirmed: Boolean(lead.propertyType),
          areaConfirmed: lead.areas.length > 0,
          agentReady: lead.score >= 70,
        },
        summary: lead.summary,
      },
      conversation: {
        channel: lead.channel,
        aiActive: true,
        messageCount: lead.messages.length,
        lastMessageAt: minutesAgo(lead.messages[lead.messages.length - 1][2]),
      },
      status: lead.status,
      source: lead.source,
      consent: { given: true, givenAt: minutesAgo(lead.messages[0][2]) },
      createdAt: minutesAgo(lead.messages[0][2]),
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const [index, [type, text, minutes]] of lead.messages.entries()) {
      const msgRef = leadRef.collection("messages").doc(`m${index + 1}`);
      await msgRef.set({
        messageId: msgRef.id,
        tenantId,
        leadId: lead.id,
        type,
        channel: lead.channel,
        senderType: type === "inbound" ? "lead" : "ai",
        content: { text },
        metadata:
          type === "outbound"
            ? {
                aiGenerated: true,
                aiModel: "demo-seed",
                tokensUsed: Math.ceil(text.length / 4),
                complianceCheck: "passed",
                deliveryStatus: "sent",
              }
            : { deliveryStatus: "received" },
        timestamp: minutesAgo(minutes),
        createdAt: minutesAgo(minutes),
      });
    }
    console.log(`  lead: ${lead.name} (${lead.messages.length} messages)`);
  }

  const appointments = [
    {
      id: "demo-appt-aisha",
      leadId: "demo-lead-aisha",
      leadName: "Aisha Rahman",
      type: "property_viewing",
      status: "confirmed",
      start: daysFromNow(1, 11),
      end: daysFromNow(1, 12),
      location: "Marina Gate 2, Dubai Marina",
    },
    {
      id: "demo-appt-marina",
      leadId: "demo-lead-marina",
      leadName: "Marina Petrova",
      type: "property_viewing",
      status: "confirmed",
      start: daysFromNow(3, 10),
      end: daysFromNow(3, 11),
      location: "Dubai Hills Estate, Sidra 3",
    },
  ];

  for (const appt of appointments) {
    await tenantRef.collection("appointments").doc(appt.id).set({
      appointmentId: appt.id,
      tenantId,
      leadId: appt.leadId,
      leadName: appt.leadName,
      market: "dubai",
      type: appt.type,
      status: appt.status,
      scheduledAt: appt.start,
      duration: 60,
      timezone: "Asia/Dubai",
      location: { address: appt.location },
      remindersSent: { twentyFourHour: false, oneHour: false },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  appointment: ${appt.leadName}`);
  }

  await tenantRef.update({
    "usage.leadsThisMonth": LEADS.length,
    "usage.whatsappConversations": LEADS.filter((l) => l.channel === "whatsapp").length,
    "usage.aiTokensConsumed": 18450,
    "usage.appointmentsBooked": appointments.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`\nSeeded ${LEADS.length} leads for ${email}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
