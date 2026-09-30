import * as functions from "firebase-functions";
import { getGoogleOAuthConfig } from "../config/secrets";
import { functionUrl } from "../config/urls";
import { createOAuthState, uidFromIdToken } from "../utils/oauthState";

const REDIRECT_URI = functionUrl("googleCalendarCallback");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const googleCalendarConnect = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") { res.status(405).send("Method not allowed"); return; }

    // The caller proves who they are with a Firebase ID token. Trusting a uid
    // from the query string would let anyone start a connect flow for another
    // account and attach their own calendar to it.
    const idToken = req.query.token as string | undefined;
    if (!idToken) { res.status(400).send("Missing token parameter"); return; }

    let uid: string;
    try {
      uid = await uidFromIdToken(idToken);
    } catch {
      res.status(401).send("Invalid or expired sign-in token");
      return;
    }

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
        state: await createOAuthState(uid, "google"),
      });

      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error("Google Calendar connect error:", error);
      res.status(500).send("Failed to initiate Google OAuth flow");
    }
  }
);
