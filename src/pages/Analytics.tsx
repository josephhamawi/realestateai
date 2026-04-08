import React from "react";
import { Card, CardHeader } from "../components/common/Card";
import { useTenant } from "../hooks/useTenant";
import { useLeads } from "../hooks/useLeads";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function Analytics() {
  const { tenant } = useTenant();
  const { leads } = useLeads({ maxResults: 200 });

  // Lead source distribution
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.source?.replace(/_/g, " ") || "unknown";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  // Lead status distribution
  const statusCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const s = l.status?.replace(/_/g, " ") || "unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  // Urgency breakdown
  const urgencyCounts = { hot: 0, warm: 0, cold: 0 };
  leads.forEach((l) => {
    const u = l.qualification?.urgency || "cold";
    if (u in urgencyCounts) urgencyCounts[u as keyof typeof urgencyCounts]++;
  });

  const conversionRate = leads.length > 0
    ? ((leads.filter((l) => l.status === "closed" || l.status === "appointment_set").length / leads.length) * 100).toFixed(1)
    : "0.0";

  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((sum, l) => sum + (l.qualification?.score || 0), 0) / leads.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Performance insights for your {tenant?.market === "dubai" ? "Dubai" : "Nigeria"} market
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{leads.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{conversionRate}%</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{avgScore}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Hot Leads</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{urgencyCounts.hot}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lead Sources */}
        <Card>
          <CardHeader title="Lead Sources" />
          {sourceData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              No lead data yet
            </div>
          ) : sourceData.length === 1 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100">
                <span className="text-3xl font-bold text-brand-600">{sourceData[0].value}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 capitalize">{sourceData[0].name}</p>
                <p className="text-xs text-gray-500">100% of leads</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Lead Status */}
        <Card>
          <CardHeader title="Lead Pipeline" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
