import axios from "axios";
import { getGoogleOAuthConfig } from "../config/secrets";
import { db } from "../config/firebase";

const REDIRECT_URI =
  "https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback";

/**
 * Refresh access token using the stored refresh token.
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = await getGoogleOAuthConfig();
  const res = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  return res.data.access_token;
}

export async function getGoogleAvailability(
  refreshToken: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<Array<{ start: string; end: string }>> {
  const accessToken = await getAccessToken(refreshToken);
  const res = await axios.post(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      timeZone: timezone,
      items: [{ id: "primary" }],
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const busySlots = res.data.calendars?.primary?.busy || [];
  return busySlots.map((slot: { start: string; end: string }) => ({
    start: slot.start || "",
    end: slot.end || "",
  }));
}

export async function createGoogleCalendarEvent(
  refreshToken: string,
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
    location?: string;
  }
): Promise<string> {
  const accessToken = await getAccessToken(refreshToken);
  const res = await axios.post(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime, timeZone: event.timezone },
      end: { dateTime: event.endTime, timeZone: event.timezone },
      location: event.location,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.data.id || "";
}

export async function deleteGoogleCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  const accessToken = await getAccessToken(refreshToken);
  await axios.delete(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

/**
 * Create a Google Calendar event for an appointment, reading the
 * refresh token directly from the tenant document.
 */
export async function createCalendarEvent(
  tenantId: string,
  appointment: {
    scheduledAt: Date;
    leadName: string;
    leadPhone?: string;
    propertyType?: string;
    duration?: number;
    location?: string;
    timezone?: string;
  }
): Promise<string> {
  const tenantSnap = await db.doc(`tenants/${tenantId}`).get();
  if (!tenantSnap.exists) return "";

  const tenant = tenantSnap.data()!;
  const refreshToken = tenant.integrations?.calendar?.google?.refreshToken;
  if (!refreshToken) return "";

  const dur = appointment.duration || 60;
  const startTime = new Date(appointment.scheduledAt);
  const endTime = new Date(startTime.getTime() + dur * 60000);
  const tz = appointment.timezone || tenant.config?.timezone || "UTC";

  return createGoogleCalendarEvent(refreshToken, {
    title: `[AgentFlow] Viewing - ${appointment.leadName}`,
    description: [
      `Lead: ${appointment.leadName}`,
      appointment.leadPhone ? `Phone: ${appointment.leadPhone}` : "",
      appointment.propertyType ? `Property: ${appointment.propertyType}` : "",
      `Booked via AgentFlow AI`,
    ]
      .filter(Boolean)
      .join("\n"),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: tz,
    location: appointment.location,
  });
}
