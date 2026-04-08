import React from "react";
import { Check } from "lucide-react";
import { Button } from "../common/Button";
import { formatCurrency } from "../../lib/formatters";
import { useTenant } from "../../hooks/useTenant";
import { useMarketContext } from "../../contexts/MarketContext";

interface PricingDisplayProps {
  onSelectTier: (tier: "solo" | "team" | "brokerage") => void;
  loading?: boolean;
}

const tierFeatures: Record<string, string[]> = {
  solo: [
    "1 Agent",
    "AI-powered conversations",
    "WhatsApp integration",
    "Lead qualification",
    "Calendar booking",
  ],
  team: [
    "Up to 5 Agents",
    "Everything in Solo",
    "Team lead management",
    "Advanced analytics",
    "Priority support",
  ],
  brokerage: [
    "Unlimited Agents",
    "Everything in Team",
    "Unlimited leads",
    "Custom AI persona",
    "API access",
    "Dedicated support",
  ],
};

export function PricingDisplay({ onSelectTier, loading }: PricingDisplayProps) {
  const { tenant } = useTenant();
  const { marketConfig } = useMarketContext();

  const tiers = marketConfig?.subscriptionTiers;
  const currency = tenant?.config.currency || { code: "USD", symbol: "$", locale: "en-US" };
  const currentTier = tenant?.integrations.payments?.tier;

  if (!tiers) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {(["solo", "team", "brokerage"] as const).map((tierKey) => {
        const tier = tiers[tierKey];
        const isCurrent = currentTier === tierKey;
        const isPopular = tierKey === "team";

        return (
          <div
            key={tierKey}
            className={`relative rounded-xl border-2 p-6 ${
              isPopular
                ? "border-brand-500 shadow-lg"
                : "border-gray-200"
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
                Popular
              </span>
            )}
            <h3 className="text-lg font-semibold capitalize text-gray-900">{tierKey}</h3>
            <div className="mt-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(tier.price, currency.code, currency.locale)}
              </span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {tier.leadsPerMonth === -1
                ? "Unlimited leads"
                : `Up to ${tier.leadsPerMonth} leads/month`}
            </p>
            <ul className="mt-4 space-y-2">
              {tierFeatures[tierKey].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={isCurrent ? "secondary" : isPopular ? "primary" : "outline"}
              className="mt-6 w-full"
              disabled={isCurrent}
              loading={loading}
              onClick={() => onSelectTier(tierKey)}
            >
              {isCurrent ? "Current Plan" : "Select Plan"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
