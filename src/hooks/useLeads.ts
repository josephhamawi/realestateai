import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useTenantContext } from "../contexts/TenantContext";

export interface LeadData {
  leadId: string;
  tenantId: string;
  market: "nigeria" | "dubai";
  source: string;
  status: string;
  createdAt: unknown;
  updatedAt: unknown;
  contact: {
    name: string;
    phone: string;
    email?: string;
    preferredLanguage: string;
    whatsappProfileName?: string;
    telegramChatId?: string;
    telegramUsername?: string;
  };
  propertyInterest: {
    budgetMin: number;
    budgetMax: number;
    currency: string;
    timeline: string;
    propertyType: string;
    desiredAreas: string[];
  };
  qualification: {
    score: number;
    status: string;
    urgency: "hot" | "warm" | "cold";
    readiness: {
      budgetConfirmed: boolean;
      timelineConfirmed: boolean;
      propertyTypeConfirmed: boolean;
      areaConfirmed: boolean;
      agentReady: boolean;
    };
    summary?: string;
  };
  conversation: {
    threadId: string;
    channel: string;
    lastMessageAt: unknown;
    messageCount: number;
    aiActive: boolean;
  };
  appointment?: {
    appointmentId: string;
    scheduledAt: unknown;
    status: string;
  };
  notes?: string;
}

export interface LeadFilters {
  status?: string;
  urgency?: string;
  source?: string;
  maxResults?: number;
}

export function useLeads(filters: LeadFilters = {}) {
  const { tenant } = useTenantContext();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.tenantId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters.urgency) {
      constraints.push(where("qualification.urgency", "==", filters.urgency));
    }
    if (filters.source) {
      constraints.push(where("source", "==", filters.source));
    }

    constraints.push(orderBy("updatedAt", "desc"));
    constraints.push(limit(filters.maxResults || 50));

    const q = query(
      collection(db, `tenants/${tenant.tenantId}/leads`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          ...d.data(),
          leadId: d.id,
        })) as LeadData[];
        setLeads(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading leads:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenant?.tenantId, filters.status, filters.urgency, filters.source, filters.maxResults]);

  return { leads, loading };
}
