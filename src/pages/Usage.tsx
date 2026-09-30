import React from "react";
import { Card } from "../components/common/Card";
import { useTenant } from "../hooks/useTenant";
import { MessageSquare, Brain, Calendar, Users } from "lucide-react";

export function Usage() {
  const { tenant } = useTenant();
  const usage = tenant?.usage;

  const stats = [
    {
      label: "Leads This Month",
      value: usage?.leadsThisMonth || 0,
      icon: Users,
      color: "text-brand-600",
      bgColor: "bg-brand-50",
    },
    {
      label: "Conversations",
      value: usage?.whatsappConversations || 0,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "AI Tokens Used",
      value: usage?.aiTokensConsumed || 0,
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Appointments Booked",
      value: usage?.appointmentsBooked || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
        <p className="mt-1 text-sm text-gray-500">
          Activity on this instance. There are no plans or limits: usage is
          bounded only by the AI and messaging accounts you connected.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Where your spend actually happens
        </h3>
        <p className="text-sm text-gray-600">
          This app does not bill you. Token and message volume is charged
          directly by the providers whose keys you entered on the API Keys
          screen (Anthropic, OpenAI, Google, Meta, Telegram). Check each
          provider dashboard for current pricing and invoices.
        </p>
      </Card>
    </div>
  );
}
