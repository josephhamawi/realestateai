import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuthContext } from "./AuthContext";

export interface TenantData {
  tenantId: string;
  market: "nigeria" | "dubai";
  region: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  createdAt: unknown;
  updatedAt: unknown;
  agent: {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    brokerage: string;
    preferredLanguage: string;
  };
  config: {
    currency: { code: string; symbol: string; locale: string };
    timezone: string;
    weekend: string[];
    dateFormat: string;
    compliance: {
      framework: "NDPR" | "RERA";
      consentRequired: boolean;
      auditRetentionYears: number;
    };
  };
  aiConfig: {
    personaName: string;
    greetingScript: string;
    handoffThreshold: number;
    qualificationQuestions: string[];
    languages: string[];
    features: {
      offPlanSupport: boolean;
      rentalYieldCalc: boolean;
      mobileMoney: boolean;
      ejariIntegration: boolean;
    };
    approvalMode: boolean;
  };
  integrations: {
    whatsapp: { enabled: boolean; phoneNumberId?: string; wabaId?: string };
    calendar: {
      google?: { enabled: boolean; email?: string };
      outlook?: { enabled: boolean; email?: string };
      preferred?: "google" | "outlook";
    };
    payments: {
      provider?: "paystack" | "stripe";
      customerId?: string;
      subscriptionId?: string;
      tier?: "solo" | "team" | "brokerage";
      currentPeriodEnd?: unknown;
    };
    crm: {
      webhooks?: Record<string, { enabled: boolean; apiKey: string; url: string }>;
    };
  };
  usage: {
    leadsThisMonth: number;
    whatsappConversations: number;
    aiTokensConsumed: number;
    appointmentsBooked: number;
    lastResetAt: unknown;
  };
  team: {
    agents: Record<string, {
      name: string;
      email: string;
      role: "admin" | "agent";
      status: "active" | "invited" | "disabled";
    }>;
  };
}

interface TenantContextValue {
  tenant: TenantData | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({ tenant: null, loading: true });

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTenant(null);
      setLoading(false);
      return;
    }

    console.log("[TenantContext] Subscribing to tenant doc for uid:", user.uid);
    const unsubscribe = onSnapshot(
      doc(db, "tenants", user.uid),
      (snap) => {
        if (snap.exists()) {
          console.log("[TenantContext] Tenant doc found:", snap.id);
          setTenant(snap.data() as TenantData);
        } else {
          console.warn("[TenantContext] Tenant doc does NOT exist for uid:", user.uid);
          setTenant(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[TenantContext] Error reading tenant doc:", error.code, error.message);
        setTenant(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  return useContext(TenantContext);
}

export default TenantContext;
