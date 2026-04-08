import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import { Card, CardHeader } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { PricingDisplay } from "../components/market/PricingDisplay";
import { CurrencyFormat } from "../components/market/CurrencyFormat";
import { useTenant } from "../hooks/useTenant";
import { toast } from "../components/common/Toast";

export function Billing() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleSelectTier = async (tier: "solo" | "team" | "brokerage") => {
    setLoading(true);
    try {
      const initializePayment = httpsCallable(functions, "initializePayment");
      const result = await initializePayment({ tier });
      const data = result.data as { url?: string; authorizationUrl?: string };
      const redirectUrl = data.url || data.authorizationUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Payment failed";
      toast("error", "Payment initialization failed", message);
    } finally {
      setLoading(false);
    }
  };

  const currentTier = tenant?.integrations.payments?.tier;
  const provider = tenant?.integrations.payments?.provider;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader title="Current Plan" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold capitalize text-gray-900">
                {currentTier || "Free Trial"}
              </span>
              <Badge
                variant={tenant?.status === "active" ? "success" : "warning"}
              >
                {tenant?.status || "trial"}
              </Badge>
            </div>
            {provider && (
              <p className="mt-1 text-sm text-gray-500">
                Billed via {provider === "paystack" ? "Paystack" : "Stripe"}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Usage this month</p>
            <p className="text-sm font-medium text-gray-900">
              {tenant?.usage.leadsThisMonth || 0} leads
            </p>
          </div>
        </div>
      </Card>

      {/* Usage Summary */}
      <Card>
        <CardHeader title="Usage Summary" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Leads</p>
            <p className="text-xl font-bold text-gray-900">
              {tenant?.usage.leadsThisMonth || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Conversations</p>
            <p className="text-xl font-bold text-gray-900">
              {tenant?.usage.whatsappConversations || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">AI Tokens</p>
            <p className="text-xl font-bold text-gray-900">
              {(tenant?.usage.aiTokensConsumed || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Appointments</p>
            <p className="text-xl font-bold text-gray-900">
              {tenant?.usage.appointmentsBooked || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {currentTier ? "Change Plan" : "Select a Plan"}
        </h2>
        <PricingDisplay onSelectTier={handleSelectTier} loading={loading} />
      </div>
    </div>
  );
}
