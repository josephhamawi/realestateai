import * as functions from "firebase-functions";
import { google } from "googleapis";
import { getGoogleOAuthConfig } from "../config/secrets";

const REDIRECT_URI =
  "https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Initiates the Google OAuth2 flow for calendar integration.
 *
 * GET /googleCalendarConnect?uid={userId}
 *
 * Generates a Google consent URL and redirects the user to it.
 * The `state` parameter carries the userId so we can associate
 * the tokens with the correct tenant on callback.
 */
export const googleCalendarConnect = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    const uid = req.query.uid as string | undefined;
    if (!uid) {
      res.status(400).send("Missing uid parameter");
      return;
    }

    try {
      const { clientId, clientSecret } = await getGoogleOAuthConfig();

      if (!clientId || !clientSecret) {
        res
          .status(500)
          .send(
            "Google OAuth is not configured. Please set client ID and secret in the admin dashboard."
          );
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        REDIRECT_URI
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        state: uid,
        prompt: "consent",
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error("Google Calendar connect error:", error);
      res.status(500).send("Failed to initiate Google OAuth flow");
    }
  }
);
