import * as functions from "firebase-functions";
import { db, FieldValue } from "../config/firebase";
import { loadTenant, loadMarketConfig } from "../utils/marketConfig";
import {
  getGoogleAvailability,
  createGoogleCalendarEvent,
} from "../services/googleCalendar";
import {
  getOutlookAvailability,
  createOutlookCalendarEvent,
} from "../services/outlookCalendar";
import type { MarketConfig } from "../types/market";
import { requireTenantAccess } from "../utils/auth";

export const calendarManager = functions.https.onCall(
  async (
    data: {
      action: string;
      tenantId: string;
      leadId?: string;
      appointmentData?: Record<string, unknown>;
    },
    context
  ) => {
    const { action, tenantId, leadId, appointmentData } = data;

    requireTenantAccess(context, tenantId);

    const tenant = await loadTenant(tenantId);
    const marketConfig = await loadMarketConfig();

    switch (action) {
      case "checkAvailability": {
        const dateRange = appointmentData as {
          startDate: string;
          endDate: string;
        };
        const busySlots: Array<{ start: string; end: string }> = [];

        // Check Google Calendar
        if (tenant.integrations.calendar.google?.enabled &&
            tenant.integrations.calendar.google.refreshToken) {
          const googleBusy = await getGoogleAvailability(
            tenant.integrations.calendar.google.refreshToken,
            dateRange.startDate,
            dateRange.endDate,
            tenant.config.timezone
          );
          busySlots.push(...googleBusy);
        }

        // Check Outlook Calendar
        if (tenant.integrations.calendar.outlook?.enabled &&
            tenant.integrations.calendar.outlook.refreshToken &&
            tenant.integrations.calendar.outlook.email) {
          const outlookBusy = await getOutlookAvailability(
            tenant.integrations.calendar.outlook.refreshToken,
            tenant.integrations.calendar.outlook.email,
            dateRange.startDate,
            dateRange.endDate,
            tenant.config.timezone
          );
          busySlots.push(...outlookBusy);
        }

        // Generate available slots (simplified: 9 AM to 6 PM, 1-hour slots)
        const availableSlots = generateAvailableSlots(
          dateRange.startDate,
          dateRange.endDate,
          busySlots,
          marketConfig,
          tenant.config.timezone
        );

        return { availableSlots };
      }

      case "createAppointment": {
        if (!leadId || !appointmentData) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "leadId and appointmentData required"
          );
        }

        const { scheduledAt, duration, type, location, notes } =
          appointmentData as {
            scheduledAt: string;
            duration?: number;
            type?: string;
            location?: { address: string };
            notes?: string;
          };

        // Load lead
        const leadSnap = await db
          .doc(`tenants/${tenantId}/leads/${leadId}`)
          .get();
        if (!leadSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Lead not found");
        }
        const lead = leadSnap.data()!;
        const dur = duration || 60;

        // Calculate end time
        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + dur * 60000);

        // Create calendar event on preferred provider
        let calendarEventId = "";
        const provider = tenant.integrations.calendar.preferred || "google";

        if (
          provider === "google" &&
          tenant.integrations.calendar.google?.enabled &&
          tenant.integrations.calendar.google.refreshToken
        ) {
          calendarEventId = await createGoogleCalendarEvent(
            tenant.integrations.calendar.google.refreshToken,
            {
              title: `Viewing - ${lead.contact.name}`,
              description: `Lead: ${lead.contact.name}\nPhone: ${lead.contact.phone}\nProperty: ${lead.propertyInterest?.propertyType || "N/A"}`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              timezone: tenant.config.timezone,
              location: location?.address,
            }
          );
        } else if (
          provider === "outlook" &&
          tenant.integrations.calendar.outlook?.enabled &&
          tenant.integrations.calendar.outlook.refreshToken
        ) {
          calendarEventId = await createOutlookCalendarEvent(
            tenant.integrations.calendar.outlook.refreshToken,
            {
              title: `Viewing - ${lead.contact.name}`,
              description: `Lead: ${lead.contact.name}<br>Phone: ${lead.contact.phone}`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              timezone: tenant.config.timezone,
              location: location?.address,
            }
          );
        }

        // Create Firestore appointment
        const apptRef = db
          .collection(`tenants/${tenantId}/appointments`)
          .doc();
        await apptRef.set({
          appointmentId: apptRef.id,
          tenantId,
          market: tenant.market,
          leadId,
          scheduledAt: startTime,
          duration: dur,
          timezone: tenant.config.timezone,
          status: "scheduled",
          type: type || "property_viewing",
          location: location || null,
          calendarEventId,
          calendarProvider: provider,
          remindersSent: { twentyFourHour: false, oneHour: false },
          notes: notes || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update lead
        await db.doc(`tenants/${tenantId}/leads/${leadId}`).update({
          "appointment.appointmentId": apptRef.id,
          "appointment.scheduledAt": startTime,
          "appointment.status": "scheduled",
          status: "appointment_set",
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Increment usage
        await db.doc(`tenants/${tenantId}`).update({
          "usage.appointmentsBooked": FieldValue.increment(1),
        });

        return {
          appointmentId: apptRef.id,
          calendarEventId,
        };
      }

      case "reschedule": {
        // Update appointment and calendar event
        return { status: "not_implemented" };
      }

      case "cancel": {
        // Cancel appointment and delete calendar event
        return { status: "not_implemented" };
      }

      default:
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid action"
        );
    }
  }
);

function generateAvailableSlots(
  startDate: string,
  endDate: string,
  busySlots: Array<{ start: string; end: string }>,
  marketConfig: MarketConfig,
  timezone: string
): Array<{ start: string; end: string }> {
  const available: Array<{ start: string; end: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weekendDays = marketConfig.weekend.map((d) => {
    const map: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    };
    return map[d] ?? -1;
  });

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();

    // Skip weekends
    if (weekendDays.includes(dayOfWeek)) continue;

    // Generate hourly slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(d);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if slot conflicts with busy times
      const isBusy = busySlots.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      // Check cultural blocks
      const isCulturallyBlocked = marketConfig.culturalBlocks.enabled &&
        marketConfig.culturalBlocks.blocks.some((block) => {
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          if (block.day !== dayNames[dayOfWeek]) return false;
          const [blockStartH, blockStartM] = block.start.split(":").map(Number);
          const [blockEndH, blockEndM] = block.end.split(":").map(Number);
          const blockStartMin = blockStartH * 60 + blockStartM;
          const blockEndMin = blockEndH * 60 + blockEndM;
          const slotStartMin = hour * 60;
          return slotStartMin >= blockStartMin && slotStartMin < blockEndMin;
        });

      if (!isBusy && !isCulturallyBlocked) {
        available.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  return available;
}
