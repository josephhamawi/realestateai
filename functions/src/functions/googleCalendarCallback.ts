import * as functions from "firebase-functions";
import axios from "axios";
import { db, FieldValue } from "../config/firebase";
import { getGoogleOAuthConfig } from "../config/secrets";
import { appUrl, functionUrl } from "../config/urls";
import { consumeOAuthState } from "../utils/oauthState";

const REDIRECT_URI = functionUrl("googleCalendarCallback");

export const googleCalendarCallback = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") { res.status(405).send("Method not allowed"); return; }

    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;

    if (error) {
      res.redirect(appUrl("/settings/integrations?calendar=denied"));
      return;
    }
    if (!code || !state) { res.status(400).send("Missing code or state"); return; }

    const userId = await consumeOAuthState(state, "google");
    if (!userId) {
      res.status(400).send("This authorization link is invalid or has expired. Start the connection again from Settings.");
      return;
    }

    try {
      const { clientId, clientSecret } = await getGoogleOAuthConfig();
      if (!clientId || !clientSecret) { res.status(500).send("Google OAuth not configured."); return; }

      // Exchange code for tokens
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      });

      const refreshToken = tokenRes.data.refresh_token;
      const accessToken = tokenRes.data.access_token;

      if (!refreshToken) {
        res.status(400).send("No refresh token received. Revoke this app's access in your Google account settings and try again.");
        return;
      }

      // Get user email
      const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const email = userRes.data.email || "";

      // Store on tenant
      const tenantRef = db.doc(`tenants/${userId}`);
      const tenantSnap = await tenantRef.get();
      if (!tenantSnap.exists) { res.status(404).send("Tenant not found"); return; }

      await tenantRef.update({
        "integrations.calendar.google.connected": true,
        "integrations.calendar.google.enabled": true,
        "integrations.calendar.google.refreshToken": refreshToken,
        "integrations.calendar.google.email": email,
        "integrations.calendar.google.connectedAt": FieldValue.serverTimestamp(),
        "integrations.calendar.preferred": "google",
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`Google Calendar connected for tenant ${userId} (${email})`);
      res.redirect(appUrl("/settings/integrations?calendar=connected"));
    } catch (err) {
      console.error("Google Calendar callback error:", err);
      res.status(500).send("Failed to complete Google Calendar connection.");
    }
  }
);
