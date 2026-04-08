import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Calendar, MoreVertical } from "lucide-react";
import { Badge } from "../common/Badge";
import { LeadScoreIndicator } from "./LeadScoreIndicator";
import { formatRelativeTime, formatPhone } from "../../lib/formatters";
import type { LeadData } from "../../hooks/useLeads";

interface LeadTableProps {
  leads: LeadData[];
  loading?: boolean;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  new: "info",
  contacted: "default",
  qualified: "success",
  appointment_set: "warning",
  closed: "success",
  dead: "danger",
};

export function LeadTable({ leads, loading }: LeadTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No leads yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Leads will appear here when they message via WhatsApp or are added manually.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Interest</th>
            <th className="px-4 py-3">Last Activity</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => (
            <tr
              key={lead.leadId}
              onClick={() => navigate(`/leads/${lead.leadId}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.contact.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPhone(lead.contact.phone)}
                  </p>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[lead.status] || "default"}>
                  {lead.status.replace(/_/g, " ")}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <LeadScoreIndicator
                  score={lead.qualification?.score || 0}
                  urgency={lead.qualification?.urgency || "cold"}
                />
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">
                  {lead.source?.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">
                  {lead.propertyInterest?.propertyType || "N/A"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(lead.conversation?.lastMessageAt as Date)}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
