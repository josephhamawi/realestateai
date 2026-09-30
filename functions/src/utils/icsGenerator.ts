import { fromEmail } from "../config/urls";

/**
 * ICS Calendar File Generator (RFC 5545)
 *
 * Generates .ics calendar invite strings that can be imported into
 * Apple Calendar, Google Calendar, Outlook, and other calendar apps.
 */

export interface ICSParams {
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  durationMinutes: number;
  organizerName: string;
  organizerEmail: string;
  attendeeName?: string;
}

/**
 * Format a Date to ICS UTC datetime string: YYYYMMDDTHHmmSSZ
 */
function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Generate a unique identifier for the calendar event.
 */
function generateUID(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  return `${timestamp}-${random}@${fromEmail().split("@")[1]}`;
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 * Lines longer than 75 characters are split with CRLF + space.
 */
function foldLine(line: string): string {
  const MAX_LEN = 75;
  if (line.length <= MAX_LEN) return line;

  const parts: string[] = [];
  parts.push(line.substring(0, MAX_LEN));
  let remaining = line.substring(MAX_LEN);
  while (remaining.length > 0) {
    // Continuation lines start with a space, so effective content per line is MAX_LEN - 1
    const chunk = remaining.substring(0, MAX_LEN - 1);
    parts.push(" " + chunk);
    remaining = remaining.substring(MAX_LEN - 1);
  }
  return parts.join("\r\n");
}

/**
 * Escape special characters in ICS text values.
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate an ICS calendar file string for an appointment.
 *
 * @param params - Event parameters
 * @returns Complete ICS file content as a string
 */
export function generateICS(params: ICSParams): string {
  const {
    title,
    description,
    location,
    startTime,
    durationMinutes,
    organizerName,
    organizerEmail,
    attendeeName,
  } = params;

  // Calculate end time
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const dtStart = formatDateUTC(startTime);
  const dtEnd = formatDateUTC(endTime);
  const dtStamp = formatDateUTC(new Date());
  const uid = generateUID();

  const escapedTitle = escapeText(title);
  const escapedDescription = escapeText(description);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RealEstateAI//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapedTitle}`,
    `DESCRIPTION:${escapedDescription}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`);
  }

  // Organizer
  if (organizerEmail) {
    lines.push(
      `ORGANIZER;CN=${escapeText(organizerName)}:mailto:${organizerEmail}`
    );
  }

  // Attendee
  if (attendeeName) {
    lines.push(
      `ATTENDEE;CN=${escapeText(attendeeName)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${fromEmail()}`
    );
  }

  lines.push("STATUS:CONFIRMED");

  // VALARM: 1 hour before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${escapedTitle} in 1 hour`,
    "END:VALARM"
  );

  // VALARM: 15 minutes before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${escapedTitle} in 15 minutes`,
    "END:VALARM"
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  // Fold long lines and join with CRLF (RFC 5545 requires CRLF)
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
