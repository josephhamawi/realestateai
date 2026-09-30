import * as functions from "firebase-functions";
import { getMicrosoftOAuthConfig } from "../config/secrets";
import { functionUrl } from "../config/urls";
import { createOAuthState, uidFromIdToken } from "../utils/oauthState";

const REDIRECT_URI = functionUrl("outlookCalendarCallback");

const SCOPES = "Calendars.ReadWrite User.Read offline_access";

/**
 * Initiates the Microsoft OAuth2 flow for Outlook Calendar integration.
 *
 * GET /outlookCalendarConnect?uid={userId}
 *
 * Generates a Microsoft consent URL and redirects the user to it.
 * The `state` parameter carries the userId so we can associate
 * the tokens with the correct tenant on callback.
 */
export const outlookCalendarConnect = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    // Authenticate the caller rather than trusting a uid from the query string.
    const idToken = req.query.token as string | undefined;
    if (!idToken) {
      res.status(400).send("Missing token parameter");
      return;
    }

    let uid: string;
    try {
      uid = await uidFromIdToken(idToken);
    } catch {
      res.status(401).send("Invalid or expired sign-in token");
      return;
    }

    try {
      const { clientId, clientSecret } = await getMicrosoftOAuthConfig();

      if (!clientId || !clientSecret) {
        res
          .status(500)
          .send(
            "Microsoft OAuth is not configured. Please set client ID and secret in the admin dashboard."
          );
        return;
      }

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        response_mode: "query",
        scope: SCOPES,
        state: await createOAuthState(uid, "outlook"),
        prompt: "consent",
      });

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

      res.redirect(authUrl);
    } catch (error) {
      console.error("Outlook Calendar connect error:", error);
      res.status(500).send("Failed to initiate Microsoft OAuth flow");
    }
  }
);
