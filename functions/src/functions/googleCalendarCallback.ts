import * as functions from "firebase-functions";
import { google } from "googleapis";
import { db, FieldValue } from "../config/firebase";
import { getGoogleOAuthConfig } from "../config/secrets";

const REDIRECT_URI =
  "https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback";

const SUCCESS_REDIRECT =
  "https://agentflowai-11dd2.web.app/settings/integrations?calendar=connected";

/**
 * Handles the Google OAuth2 callback after the user grants consent.
 *
 * GET /googleCalendarCallback?code={code}&state={userId}
 *
 * Exchanges the authorization code for access + refresh tokens,
 * stores the refresh token on the tenant document, and redirects
 * the user back to the integrations settings page.
 */
export const googleCalendarCallback = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;

    // User denied access
    if (error) {
      console.warn("Google OAuth denied:", error);
      res.redirect(
        "https://agentflowai-11dd2.web.app/settings/integrations?calendar=denied"
      );
      return;
    }

    if (!code || !state) {
      res.status(400).send("Missing code or state parameter");
      return;
    }

    const userId = state;

    try {
      const { clientId, clientSecret } = await getGoogleOAuthConfig();

      if (!clientId || !clientSecret) {
        res
          .status(500)
          .send("Google OAuth is not configured on the platform.");
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        REDIRECT_URI
      );

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        console.error(
          "No refresh token received — user may have already granted access previously."
        );
        res
          .status(400)
          .send(
            "No refresh token received. Please revoke AgentFlow AI access in your Google account settings and try again."
          );
        return;
      }

      // Get the user's email from the token
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email || "";

      // Find the tenant document for this user.
      // The userId (uid from Firebase Auth) is stored as the tenantId.
      const tenantRef = db.doc(`tenants/${userId}`);
      const tenantSnap = await tenantRef.get();

      if (!tenantSnap.exists) {
        console.error(`Tenant not found for userId: ${userId}`);
        res.status(404).send("Tenant account not found");
        return;
      }

      // Store the Google Calendar integration details
      await tenantRef.update({
        "integrations.calendar.google.connected": true,
        "integrations.calendar.google.enabled": true,
        "integrations.calendar.google.refreshToken": refreshToken,
        "integrations.calendar.google.email": email,
        "integrations.calendar.google.connectedAt":
          FieldValue.serverTimestamp(),
        "integrations.calendar.preferred": "google",
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(
        `Google Calendar connected for tenant ${userId} (${email})`
      );

      // Redirect user back to the app
      res.redirect(SUCCESS_REDIRECT);
    } catch (err) {
      console.error("Google Calendar callback error:", err);
      res
        .status(500)
        .send("Failed to complete Google Calendar connection. Please try again.");
    }
  }
);
