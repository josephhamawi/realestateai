import axios from "axios";
import { getMicrosoftOAuthConfig } from "../config/secrets";
import { db } from "../config/firebase";

/**
 * Refresh the access token using the stored refresh token and
 * client credentials from platform_config.
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = await getMicrosoftOAuthConfig();

  const response = await axios.post(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "Calendars.ReadWrite User.Read offline_access",
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return response.data.access_token || "";
}

export async function getOutlookAvailability(
  refreshToken: string,
  email: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<Array<{ start: string; end: string }>> {
  const token = await getAccessToken(refreshToken);

  const response = await axios.post(
    "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
    {
      schedules: [email],
      startTime: { dateTime: startDate, timeZone: timezone },
      endTime: { dateTime: endDate, timeZone: timezone },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const scheduleItems =
    response.data.value?.[0]?.scheduleItems || [];

  return scheduleItems.map(
    (item: { start: { dateTime: string }; end: { dateTime: string } }) => ({
      start: item.start.dateTime,
      end: item.end.dateTime,
    })
  );
}

export async function createOutlookCalendarEvent(
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
  const token = await getAccessToken(refreshToken);

  const response = await axios.post(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      subject: event.title,
      body: { contentType: "HTML", content: event.description },
      start: { dateTime: event.startTime, timeZone: event.timezone },
      end: { dateTime: event.endTime, timeZone: event.timezone },
      location: event.location
        ? { displayName: event.location }
        : undefined,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data.id || "";
}

export async function deleteOutlookCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  const token = await getAccessToken(refreshToken);

  await axios.delete(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

/**
 * Create an Outlook Calendar event for an appointment, reading the
 * refresh token directly from the tenant document.
 *
 * Returns the Outlook Calendar event ID, or empty string if calendar is not connected.
 */
export async function createOutlookEvent(
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
  const refreshToken = tenant.integrations?.calendar?.outlook?.refreshToken;
  if (!refreshToken) return "";

  const dur = appointment.duration || 60;
  const startTime = new Date(appointment.scheduledAt);
  const endTime = new Date(startTime.getTime() + dur * 60000);
  const tz = appointment.timezone || tenant.config?.timezone || "UTC";

  const eventId = await createOutlookCalendarEvent(refreshToken, {
    title: `[AgentFlow] Viewing - ${appointment.leadName}`,
    description: [
      `Lead: ${appointment.leadName}`,
      appointment.leadPhone ? `Phone: ${appointment.leadPhone}` : "",
      appointment.propertyType ? `Property: ${appointment.propertyType}` : "",
      `Booked via AgentFlow AI`,
    ]
      .filter(Boolean)
      .join("<br>"),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: tz,
    location: appointment.location,
  });

  return eventId;
}
