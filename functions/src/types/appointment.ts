import { Timestamp } from "firebase-admin/firestore";

export interface Appointment {
  appointmentId: string;
  tenantId: string;
  market: "dubai";
  leadId: string;
  agentId?: string;

  scheduledAt: Timestamp;
  duration: number;
  timezone: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  type:
    | "property_viewing"
    | "buyer_consultation"
    | "valuation"
    | "video_call"
    | "other";

  location?: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
  };

  calendarEventId?: string;
  calendarProvider?: "google" | "outlook";
  remindersSent: {
    twentyFourHour: boolean;
    oneHour: boolean;
  };

  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
