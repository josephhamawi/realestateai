import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, MoreVertical, Eye, Flame, Snowflake, Trash2, CalendarPlus, UserCheck } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Badge } from "../common/Badge";
import { LeadScoreIndicator } from "./LeadScoreIndicator";
import { formatRelativeTime, formatPhone } from "../../lib/formatters";
import { useTenant } from "../../hooks/useTenant";
import { toast } from "../common/Toast";
import type { LeadData } from "../../hooks/useLeads";

interface LeadTableProps {
  leads: LeadData[];
  loading?: boolean;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  new: "info",
  contacted: "default",
  qualifying: "default",
  qualified: "success",
  appointment_set: "warning",
  closed: "success",
  dead: "danger",
};

function ActionsMenu({ lead, onClose }: { lead: LeadData; onClose: () => void }) {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const updateLead = async (updates: Record<string, unknown>) => {
    if (!tenant?.tenantId) return;
    try {
      await updateDoc(doc(db, `tenants/${tenant.tenantId}/leads`, lead.leadId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast("success", "Lead updated");
    } catch {
      toast("error", "Failed to update lead");
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-8 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        <button
          onClick={() => { navigate(`/leads/${lead.leadId}`); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" /> View Details
        </button>
        <button
          onClick={() => updateLead({ "qualification.urgency": "hot", "qualification.score": Math.max(lead.qualification?.score || 0, 70) })}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Flame className="h-4 w-4 text-red-500" /> Mark Hot
        </button>
        <button
          onClick={() => updateLead({ "qualification.urgency": "cold" })}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Snowflake className="h-4 w-4 text-blue-500" /> Mark Cold
        </button>
        <button
          onClick={() => updateLead({ status: "qualified", "qualification.readiness.agentReady": true })}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <UserCheck className="h-4 w-4 text-green-500" /> Mark Qualified
        </button>
        <button
          onClick={() => updateLead({ status: "appointment_set" })}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <CalendarPlus className="h-4 w-4 text-brand-500" /> Set Appointment
        </button>
        <hr className="my-1 border-gray-100" />
        <button
          onClick={() => updateLead({ status: "dead" })}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Mark Dead
        </button>
      </div>
    </>
  );
}

export function LeadTable({ leads, loading }: LeadTableProps) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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
          Leads will appear here when they message via Telegram/WhatsApp or are added manually.
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
                    {lead.contact.phone ? formatPhone(lead.contact.phone) : lead.contact.telegramUsername ? `@${lead.contact.telegramUsername}` : "No contact"}
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
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === lead.leadId ? null : lead.leadId);
                    }}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === lead.leadId && (
                    <ActionsMenu lead={lead} onClose={() => setOpenMenu(null)} />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
