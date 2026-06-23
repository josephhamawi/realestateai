import React from "react";
import { Card } from "../components/common/Card";
import { useTenant } from "../hooks/useTenant";
import { MessageSquare, Brain, Calendar, Users, TrendingUp } from "lucide-react";

export function Usage() {
  const { tenant } = useTenant();
  const usage = tenant?.usage;

  const tierLimits: Record<string, { leads: number; label: string }> = {
    solo: { leads: 100, label: "Solo" },
    team: { leads: 500, label: "Team" },
    brokerage: { leads: -1, label: "Brokerage" },
  };
  const currentTier = tenant?.integrations?.payments?.tier || "solo";
  const tier = tierLimits[currentTier] || tierLimits.solo;
  const leadsUsed = usage?.leadsThisMonth || 0;
  const leadsLimit = tier.leads;
  const leadsPercent = leadsLimit > 0 ? Math.min((leadsUsed / leadsLimit) * 100, 100) : 0;

  const stats = [
    {
      label: "Leads This Month",
      value: leadsUsed,
      limit: leadsLimit > 0 ? `/ ${leadsLimit}` : "Unlimited",
      icon: Users,
      color: "text-brand-600",
      bgColor: "bg-brand-50",
      percent: leadsLimit > 0 ? leadsPercent : null,
    },
    {
      label: "Conversations",
      value: usage?.whatsappConversations || 0,
      limit: null,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
      percent: null,
    },
    {
      label: "AI Tokens Used",
      value: usage?.aiTokensConsumed || 0,
      limit: null,
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      percent: null,
    },
    {
      label: "Appointments Booked",
      value: usage?.appointmentsBooked || 0,
      limit: null,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      percent: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your platform consumption for the Dubai market
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="border-brand-200 bg-brand-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-brand-900">
                {tier.label} Plan
              </h2>
            </div>
            <p className="mt-1 text-sm text-brand-700">
              {leadsLimit > 0
                ? `${leadsUsed} of ${leadsLimit} leads used this billing cycle`
                : `${leadsUsed} leads this cycle — unlimited plan`}
            </p>
          </div>
          {leadsLimit > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-brand-900">
                {Math.round(leadsPercent)}%
              </p>
              <p className="text-xs text-brand-600">used</p>
            </div>
          )}
        </div>
        {leadsLimit > 0 && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-200">
            <div
              className={`h-full rounded-full transition-all ${
                leadsPercent > 90 ? "bg-red-500" : leadsPercent > 70 ? "bg-yellow-500" : "bg-brand-600"
              }`}
              style={{ width: `${leadsPercent}%` }}
            />
          </div>
        )}
      </Card>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                  {stat.limit && (
                    <span className="text-sm text-gray-400">{stat.limit}</span>
                  )}
                </div>
              </div>
            </div>
            {stat.percent !== null && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    stat.percent > 90 ? "bg-red-500" : stat.percent > 70 ? "bg-yellow-500" : "bg-brand-500"
                  }`}
                  style={{ width: `${stat.percent}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Cost Estimates */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Estimated Costs This Month</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Messaging (Telegram)</span>
            <span className="text-sm font-medium text-green-600">Free</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">AI Processing ({usage?.aiTokensConsumed?.toLocaleString() || 0} tokens)</span>
            <span className="text-sm font-medium text-gray-900">
              ~${((usage?.aiTokensConsumed || 0) * 0.000003).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">WhatsApp Messages</span>
            <span className="text-sm font-medium text-gray-400">Not configured</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
