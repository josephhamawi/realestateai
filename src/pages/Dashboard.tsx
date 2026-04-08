import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { LeadScoreIndicator } from "../components/leads/LeadScoreIndicator";
import { useTenant } from "../hooks/useTenant";
import { useLeads } from "../hooks/useLeads";
import { useAppointments } from "../hooks/useAppointments";
import { formatRelativeTime } from "../lib/formatters";

export function Dashboard() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { leads } = useLeads({ maxResults: 5 });
  const { appointments } = useAppointments({ upcoming: true, maxResults: 5 });

  const stats = [
    {
      label: "Total Leads",
      value: tenant?.usage.leadsThisMonth || 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Appointments",
      value: tenant?.usage.appointmentsBooked || 0,
      icon: Calendar,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Conversations",
      value: tenant?.usage.whatsappConversations || 0,
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "AI Tokens Used",
      value: tenant?.usage.aiTokensConsumed || 0,
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back{tenant?.agent?.name ? `, ${tenant.agent.name}` : ""}. Here's your overview.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader
            title="Recent Leads"
            action={
              <button
                onClick={() => navigate("/leads")}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
              >
                View all <ArrowRight className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-3">
            {leads.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No leads yet</p>
            )}
            {leads.map((lead) => (
              <div
                key={lead.leadId}
                onClick={() => navigate(`/leads/${lead.leadId}`)}
                className="flex items-center justify-between rounded-lg p-3 transition-colors cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {lead.contact.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.contact.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(lead.conversation?.lastMessageAt as Date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LeadScoreIndicator
                    score={lead.qualification?.score || 0}
                    urgency={lead.qualification?.urgency || "cold"}
                  />
                  <Badge
                    variant={
                      lead.status === "qualified" ? "success" : lead.status === "new" ? "info" : "default"
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader
            title="Upcoming Appointments"
            action={
              <button
                onClick={() => navigate("/calendar")}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
              >
                View calendar <ArrowRight className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-3">
            {appointments.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No upcoming appointments</p>
            )}
            {appointments.map((apt) => {
              const date = apt.scheduledAt?.toDate?.();
              return (
                <div key={apt.appointmentId} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-xs font-medium">
                        {date
                          ? new Intl.DateTimeFormat("en", { month: "short" }).format(date)
                          : "--"}
                      </span>
                      <span className="text-sm font-bold">{date?.getDate() || "--"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {apt.type?.replace(/_/g, " ") || "Viewing"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date
                          ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)
                          : "TBD"}
                        {" - "}
                        {apt.duration}min
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={apt.status === "confirmed" ? "success" : "info"}
                  >
                    {apt.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
