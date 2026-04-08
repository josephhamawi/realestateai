import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useTenantContext } from "./TenantContext";

export interface MarketConfigData {
  marketId: "nigeria" | "dubai";
  displayName: string;
  region: string;
  currency: { code: string; symbol: string; locale: string };
  timezone: string;
  weekend: string[];
  dateFormat: string;
  compliance: {
    framework: "NDPR" | "RERA";
    consentRequired: boolean;
    auditRetentionYears: number;
    blockedPhrases: string[];
  };
  ai: {
    defaultPersona: string;
    systemPromptTemplate: string;
    qualificationQuestions: string[];
    escalationTriggers: string[];
  };
  whatsapp: { utilityRate: number; marketingRate: number };
  subscriptionTiers: {
    solo: { price: number; leadsPerMonth: number; maxAgents: number };
    team: { price: number; leadsPerMonth: number; maxAgents: number };
    brokerage: { price: number; leadsPerMonth: number; maxAgents: number };
  };
  phonePrefix: string;
  areas: string[];
  propertyTypes: string[];
  culturalBlocks: {
    enabled: boolean;
    blocks: Array<{ day: string; start: string; end: string; reason: string }>;
  };
}

interface MarketContextValue {
  marketConfig: MarketConfigData | null;
  loading: boolean;
}

const MarketContext = createContext<MarketContextValue>({
  marketConfig: null,
  loading: true,
});

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenantContext();
  const [marketConfig, setMarketConfig] = useState<MarketConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.market) {
      setMarketConfig(null);
      setLoading(false);
      return;
    }

    const loadMarketConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "market_config", tenant.market));
        if (snap.exists()) {
          setMarketConfig(snap.data() as MarketConfigData);
        }
      } catch (err) {
        console.error("Failed to load market config:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMarketConfig();
  }, [tenant?.market]);

  return (
    <MarketContext.Provider value={{ marketConfig, loading }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketContext(): MarketContextValue {
  return useContext(MarketContext);
}

export default MarketContext;
