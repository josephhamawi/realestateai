import { ConfidentialClientApplication } from "@azure/msal-node";
import axios from "axios";
import { getSecret } from "../config/secrets";

async function getMsalClient(): Promise<ConfidentialClientApplication> {
  const clientId = await getSecret("MS_CLIENT_ID");
  const clientSecret = await getSecret("MS_CLIENT_SECRET");

  return new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: "https://login.microsoftonline.com/common",
    },
  });
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const cca = await getMsalClient();

  const result = await cca.acquireTokenByRefreshToken({
    refreshToken,
    scopes: ["Calendars.ReadWrite"],
  });

  return result?.accessToken || "";
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
