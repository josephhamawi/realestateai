import * as functions from "firebase-functions";
import axios from "axios";
import { db, FieldValue } from "../config/firebase";
import { getMicrosoftOAuthConfig } from "../config/secrets";
import { appUrl, functionUrl } from "../config/urls";

const REDIRECT_URI = functionUrl("outlookCalendarCallback");

const SUCCESS_REDIRECT = appUrl("/settings/integrations?outlook=connected");

/**
 * Handles the Microsoft OAuth2 callback after the user grants consent.
 *
 * GET /outlookCalendarCallback?code={code}&state={userId}
 *
 * Exchanges the authorization code for access + refresh tokens,
 * fetches the user's email from Microsoft Graph,
 * stores the refresh token on the tenant document, and redirects
 * the user back to the integrations settings page.
 */
export const outlookCalendarCallback = functions.https.onRequest(
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
      console.warn("Microsoft OAuth denied:", error);
      res.redirect(
        appUrl("/settings/integrations?outlook=denied")
      );
      return;
    }

    if (!code || !state) {
      res.status(400).send("Missing code or state parameter");
      return;
    }

    const userId = state;

    try {
      const { clientId, clientSecret } = await getMicrosoftOAuthConfig();

      if (!clientId || !clientSecret) {
        res
          .status(500)
          .send("Microsoft OAuth is not configured on the platform.");
        return;
      }

      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
          scope: "Calendars.ReadWrite User.Read offline_access",
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { access_token, refresh_token } = tokenResponse.data;

      if (!refresh_token) {
        console.error(
          "No refresh token received. User may have already granted access previously."
        );
        res
          .status(400)
          .send(
            "No refresh token received. Please revoke this app's access in your Microsoft account settings and try again."
          );
        return;
      }

      // Get the user's email from Microsoft Graph
      const userResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const email =
        userResponse.data.mail ||
        userResponse.data.userPrincipalName ||
        "";

      // Find the tenant document for this user.
      const tenantRef = db.doc(`tenants/${userId}`);
      const tenantSnap = await tenantRef.get();

      if (!tenantSnap.exists) {
        console.error(`Tenant not found for userId: ${userId}`);
        res.status(404).send("Tenant account not found");
        return;
      }

      // Store the Outlook Calendar integration details
      await tenantRef.update({
        "integrations.calendar.outlook.connected": true,
        "integrations.calendar.outlook.enabled": true,
        "integrations.calendar.outlook.refreshToken": refresh_token,
        "integrations.calendar.outlook.email": email,
        "integrations.calendar.outlook.connectedAt":
          FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(
        `Outlook Calendar connected for tenant ${userId} (${email})`
      );

      // Redirect user back to the app
      res.redirect(SUCCESS_REDIRECT);
    } catch (err) {
      console.error("Outlook Calendar callback error:", err);
      res
        .status(500)
        .send(
          "Failed to complete Outlook Calendar connection. Please try again."
        );
    }
  }
);
