// RealEstateAI self-hosted WhatsApp gateway.
//
// Baileys needs an always-on Node process, which Firebase cannot host, so this
// standalone service runs on a small always-on VM. It pairs with a phone via a
// QR code, forwards inbound messages to the app's Cloud Function in Meta webhook
// format, and accepts outbound send requests in the same Meta format the app
// already produces for the meta and 360dialog providers.

import express from "express";
import qrcode from "qrcode";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";

// ---------------------------------------------------------------------------
// Configuration (from environment)
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || "8080", 10);
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "baileys";
const AUTH_DIR = process.env.AUTH_DIR || "./auth";

const logger = pino({ level: "silent" });

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let sock = null; // the active Baileys socket
let ready = false; // true once the connection is open and paired
let latestQR = null; // most recent QR string, shown on /qr until paired
let gatewayNumber = ""; // this gateway's own WhatsApp number, reported to the app

// ---------------------------------------------------------------------------
// Baileys connection
// ---------------------------------------------------------------------------
async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger,
  });

  // Persist credentials so the session survives restarts.
  sock.ev.on("creds.update", saveCreds);

  // Connection lifecycle: QR, reconnect, and ready handling.
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      console.log("New QR available. Visit /qr to pair.");
    }

    if (connection === "open") {
      ready = true;
      latestQR = null;
      gatewayNumber = (sock.user?.id || "").split(":")[0].split("@")[0];
      console.log("WhatsApp connection open. Gateway number:", gatewayNumber);
    }

    if (connection === "close") {
      ready = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = reason === DisconnectReason.loggedOut;
      console.log(
        "Connection closed.",
        loggedOut ? "Logged out, not reconnecting." : "Reconnecting..."
      );
      if (!loggedOut) {
        // Reconnect on any reason other than an explicit logout.
        startSocket().catch((err) =>
          console.error("Reconnect failed:", err?.message || err)
        );
      }
    }
  });

  // Inbound messages: forward direct text messages to the app webhook.
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const m of messages) {
      try {
        console.log("Inbound key:", JSON.stringify(m.key));
        // Ignore our own messages, groups, and status broadcasts.
        if (m.key.fromMe) continue;
        const remoteJid = m.key.remoteJid || "";

        // WhatsApp may address direct chats as either <number>@s.whatsapp.net
        // or as a privacy linked id <id>@lid. For @lid, the real phone number
        // is carried separately (senderPn / participantPn). Resolve it.
        let phoneJid = remoteJid;
        if (remoteJid.endsWith("@lid")) {
          phoneJid = m.key.senderPn || m.key.participantPn || "";
        }
        if (!phoneJid.endsWith("@s.whatsapp.net")) continue;

        const from = phoneJid.split("@")[0];
        const text =
          m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          "";
        const name = m.pushName || "";

        // v1 is text only: skip messages that carry no text body.
        if (!text) continue;

        console.log("Forwarding inbound from %s: %s", from, text.slice(0, 40));
        await forwardToWebhook({ from, id: m.key.id, text, name, ts: m.messageTimestamp });
      } catch (err) {
        console.error("Failed to process inbound message:", err?.message || err);
      }
    }
  });
}

// POST an inbound message to the Cloud Function in Meta webhook format.
async function forwardToWebhook({ from, id, text, name, ts }) {
  if (!WEBHOOK_URL) {
    console.error("WEBHOOK_URL not configured, dropping inbound message.");
    return;
  }

  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "baileys",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                phone_number_id: PHONE_NUMBER_ID,
                display_phone_number: gatewayNumber,
              },
              contacts: [{ profile: { name }, wa_id: from }],
              messages: [
                {
                  from,
                  id,
                  timestamp: String(ts || Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const url = `${WEBHOOK_URL}?token=${encodeURIComponent(VERIFY_TOKEN)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("Webhook POST status:", res.status);
  } catch (err) {
    console.error("Failed to POST to webhook:", err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// HTTP API
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Health check: reports whether the WhatsApp connection is live.
app.get("/health", (_req, res) => {
  res.json({ status: ready ? "connected" : "connecting" });
});

// Pairing page: renders the current QR as an image to scan from the phone.
app.get("/qr", async (_req, res) => {
  if (latestQR) {
    try {
      const dataUrl = await qrcode.toDataURL(latestQR);
      res.send(
        `<!doctype html><html><head><meta charset="utf-8">` +
          `<title>Pair WhatsApp</title></head>` +
          `<body style="font-family:sans-serif;text-align:center;padding:40px">` +
          `<h2>Scan to pair WhatsApp</h2>` +
          `<p>Open WhatsApp on your phone, go to Linked Devices, and scan.</p>` +
          `<img src="${dataUrl}" alt="QR code" />` +
          `</body></html>`
      );
    } catch (err) {
      res.status(500).send("Failed to render QR: " + (err?.message || err));
    }
    return;
  }

  if (ready) {
    res.send("Already paired");
    return;
  }

  res.send("Waiting for QR...");
});

// Outbound send: accepts a Meta-format body and delivers it via Baileys.
app.post("/messages", async (req, res) => {
  if (req.get("x-gateway-secret") !== GATEWAY_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!sock || !ready) {
    res.status(503).json({ error: "Gateway not connected" });
    return;
  }

  try {
    const body = req.body || {};
    const to = body.to;
    if (!to) {
      res.status(400).json({ error: "Missing 'to'" });
      return;
    }

    // v1 sends text only. Templates are delivered as their intended text if the
    // app supplies one, otherwise a generic fallback. See README limitations.
    let textBody = body.text?.body;
    if (body.type === "template" && !textBody) {
      textBody = `[template: ${body.template?.name || "notification"}]`;
    }
    if (!textBody) {
      res.status(400).json({ error: "No text body to send" });
      return;
    }

    const jid = `${to}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: textBody });

    res.json({ messages: [{ id: result?.key?.id || "" }] });
  } catch (err) {
    console.error("Failed to send message:", err?.message || err);
    res.status(500).json({ error: "Send failed" });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`WhatsApp gateway HTTP listening on port ${PORT}`);
});

startSocket().catch((err) => {
  console.error("Failed to start Baileys socket:", err?.message || err);
});
