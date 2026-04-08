import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useTenantContext } from "../contexts/TenantContext";

export interface AppointmentData {
  appointmentId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  leadId: string;
  agentId?: string;
  scheduledAt: Timestamp;
  duration: number;
  timezone: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  type: string;
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
  createdAt: unknown;
  updatedAt: unknown;
}

export function useAppointments(options?: { upcoming?: boolean; maxResults?: number }) {
  const { tenant } = useTenantContext();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.tenantId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const constraints = [];

    if (options?.upcoming) {
      constraints.push(where("scheduledAt", ">=", Timestamp.now()));
      constraints.push(where("status", "in", ["scheduled", "confirmed"]));
    }

    constraints.push(orderBy("scheduledAt", "asc"));
    constraints.push(limit(options?.maxResults || 50));

    const q = query(
      collection(db, `tenants/${tenant.tenantId}/appointments`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          ...d.data(),
          appointmentId: d.id,
        })) as AppointmentData[];
        setAppointments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading appointments:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenant?.tenantId, options?.upcoming, options?.maxResults]);

  return { appointments, loading };
}
