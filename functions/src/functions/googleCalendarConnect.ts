import * as functions from "firebase-functions";
import { getGoogleOAuthConfig } from "../config/secrets";

const REDIRECT_URI =
  "https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const googleCalendarConnect = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") { res.status(405).send("Method not allowed"); return; }

    const uid = req.query.uid as string | undefined;
    if (!uid) { res.status(400).send("Missing uid parameter"); return; }

    try {
      const { clientId, clientSecret } = await getGoogleOAuthConfig();
      if (!clientId || !clientSecret) {
        res.status(500).send("Google OAuth not configured. Set client ID and secret in admin dashboard.");
        return;
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state: uid,
      });

      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error("Google Calendar connect error:", error);
      res.status(500).send("Failed to initiate Google OAuth flow");
    }
  }
);
