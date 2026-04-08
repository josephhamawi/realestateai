import { google, calendar_v3 } from "googleapis";
import { getGoogleOAuthConfig } from "../config/secrets";
import { db } from "../config/firebase";

const REDIRECT_URI =
  "https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback";

async function getOAuth2Client(refreshToken: string) {
  const { clientId, clientSecret } = await getGoogleOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function getGoogleAvailability(
  refreshToken: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<Array<{ start: string; end: string }>> {
  const auth = await getOAuth2Client(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      timeZone: timezone,
      items: [{ id: "primary" }],
    },
  });

  const busySlots =
    response.data.calendars?.["primary"]?.busy || [];

  return busySlots.map((slot) => ({
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
  const auth = await getOAuth2Client(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime, timeZone: event.timezone },
      end: { dateTime: event.endTime, timeZone: event.timezone },
      location: event.location,
    },
  });

  return response.data.id || "";
}

export async function deleteGoogleCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  const auth = await getOAuth2Client(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

/**
 * Create a Google Calendar event for an appointment, reading the
 * refresh token directly from the tenant document.
 *
 * Returns the Google Calendar event ID, or empty string if calendar is not connected.
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

  const eventId = await createGoogleCalendarEvent(refreshToken, {
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

  return eventId;
}
