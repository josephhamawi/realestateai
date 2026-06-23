import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Phone, Mail, MapPin, Bot, UserCheck, Send, MessageSquare, User, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, Trophy, UserX, Pencil, Check, X } from "lucide-react";
import { db } from "../config/firebase";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { LeadScoreIndicator } from "../components/leads/LeadScoreIndicator";
import { ConversationThread } from "../components/conversation/ConversationThread";
import { CurrencyFormat } from "../components/market/CurrencyFormat";
import { useTenant } from "../hooks/useTenant";
import { formatPhone, formatRelativeTime } from "../lib/formatters";
import { toast } from "../components/common/Toast";
import type { LeadData } from "../hooks/useLeads";

function EditablePhone({ phone, hasTelegram, onSave }: { phone?: string; hasTelegram: boolean; onSave: (phone: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone || "");
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="+971501234567"
          autoFocus
          className="w-40 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-brand-500 focus:outline-none"
        />
        <button
          disabled={saving || !value}
          onClick={async () => {
            setSaving(true);
            await onSave(value);
            setSaving(false);
            setEditing(false);
          }}
          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setEditing(false); setValue(phone || ""); }} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (phone) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="h-4 w-4 text-gray-400" />
        {formatPhone(phone)}
        <button onClick={() => { setValue(phone); setEditing(true); }} className="text-gray-400 hover:text-brand-600">
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
    >
      <Phone className="h-4 w-4" />
      {hasTelegram ? "Add phone number" : "Add phone"}
    </button>
  );
}

export function LeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackOutcome, setFeedbackOutcome] = useState<string | null>(null);
  const [feedbackAiRating, setFeedbackAiRating] = useState<"positive" | "negative" | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    if (!tenant?.tenantId || !leadId) return;

    const unsubscribe = onSnapshot(
      doc(db, `tenants/${tenant.tenantId}/leads`, leadId),
      (snap) => {
        if (snap.exists()) {
          setLead({ ...snap.data(), leadId: snap.id } as LeadData);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [tenant?.tenantId, leadId]);

  useEffect(() => {
    if (lead?.feedback) {
      setFeedbackOutcome(lead.feedback.outcome || null);
      setFeedbackAiRating(lead.feedback.aiRating || null);
      setFeedbackNotes(lead.feedback.notes || "");
    }
  }, [lead?.feedback]);

  const saveFeedback = async () => {
    if (!tenant?.tenantId || !leadId) return;
    setSavingFeedback(true);
    try {
      await updateDoc(
        doc(db, `tenants/${tenant.tenantId}/leads`, leadId),
        {
          "feedback.outcome": feedbackOutcome,
          "feedback.aiRating": feedbackAiRating,
          "feedback.notes": feedbackNotes,
          "feedback.ratedAt": serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      toast("success", "Feedback saved", "Thank you for rating this lead outcome");
    } catch {
      toast("error", "Failed to save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  const toggleAI = async () => {
    if (!tenant?.tenantId || !leadId || !lead) return;
    try {
      await updateDoc(
        doc(db, `tenants/${tenant.tenantId}/leads`, leadId),
        {
          "conversation.aiActive": !lead.conversation.aiActive,
          updatedAt: serverTimestamp(),
        }
      );
      toast(
        "success",
        lead.conversation.aiActive ? "AI paused" : "AI activated",
        lead.conversation.aiActive
          ? "You are now handling this conversation"
          : "AI will handle responses for this lead"
      );
    } catch {
      toast("error", "Failed to toggle AI");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/leads")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {lead.contact.name || "Unknown Lead"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={lead.status === "qualified" ? "success" : "info"}>
              {lead.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-500">
              {lead.source.replace(/_/g, " ")} lead
            </span>
          </div>
        </div>
        <Button
          variant={lead.conversation.aiActive ? "outline" : "primary"}
          onClick={toggleAI}
        >
          {lead.conversation.aiActive ? (
            <>
              <UserCheck className="h-4 w-4" />
              Take Over
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              Enable AI
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <User className="h-4 w-4 text-gray-400" />
                {lead.contact.name || "Unknown"}
              </div>
              <EditablePhone
                phone={lead.contact.phone}
                hasTelegram={!!lead.contact.telegramChatId}
                onSave={async (phone) => {
                  if (!tenant?.tenantId || !leadId) return;
                  await updateDoc(doc(db, `tenants/${tenant.tenantId}/leads`, leadId), {
                    "contact.phone": phone,
                    updatedAt: serverTimestamp(),
                  });
                  toast("success", "Phone number saved");
                }}
              />
              {lead.contact.telegramUsername && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Send className="h-4 w-4 text-blue-400" />
                  @{lead.contact.telegramUsername}
                </div>
              )}
              {!lead.contact.telegramUsername && lead.contact.telegramChatId && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Send className="h-4 w-4 text-blue-400" />
                  Via Telegram
                </div>
              )}
              {lead.contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {lead.contact.email}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Qualification</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Score</span>
                <LeadScoreIndicator
                  score={lead.qualification?.score || 0}
                  urgency={lead.qualification?.urgency || "cold"}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Urgency</span>
                <Badge
                  variant={
                    lead.qualification?.urgency === "hot"
                      ? "danger"
                      : lead.qualification?.urgency === "warm"
                      ? "warning"
                      : "default"
                  }
                >
                  {lead.qualification?.urgency || "cold"}
                </Badge>
              </div>
              {lead.qualification?.summary && (
                <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  {lead.qualification.summary}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Interest</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-900">
                  {lead.propertyInterest?.propertyType?.replace(/_/g, " ") || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Budget</span>
                <span className="text-gray-900">
                  {lead.propertyInterest?.budgetMin ? (
                    <>
                      <CurrencyFormat amount={lead.propertyInterest.budgetMin} /> -{" "}
                      <CurrencyFormat amount={lead.propertyInterest.budgetMax} />
                    </>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timeline</span>
                <span className="text-gray-900">
                  {lead.propertyInterest?.timeline || "N/A"}
                </span>
              </div>
              {lead.propertyInterest?.desiredAreas?.length > 0 && (
                <div>
                  <span className="text-gray-500">Areas</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.propertyInterest.desiredAreas.map((area) => (
                      <Badge key={area} variant="default">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Outcome</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "closed_deal", label: "Closed Deal", icon: Trophy, color: "text-green-600 bg-green-50 border-green-200" },
                  { value: "no_show", label: "No Show", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
                  { value: "not_qualified", label: "Not Qualified", icon: UserX, color: "text-gray-600 bg-gray-50 border-gray-200" },
                  { value: "lost_to_competitor", label: "Lost to Competitor", icon: XCircle, color: "text-orange-600 bg-orange-50 border-orange-200" },
                  { value: "still_nurturing", label: "Still Nurturing", icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-200" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFeedbackOutcome(feedbackOutcome === option.value ? null : option.value)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      feedbackOutcome === option.value
                        ? option.color
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">AI Conversation Quality</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeedbackAiRating(feedbackAiRating === "positive" ? null : "positive")}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackAiRating === "positive"
                        ? "border-green-200 bg-green-50 text-green-600"
                        : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Good
                  </button>
                  <button
                    onClick={() => setFeedbackAiRating(feedbackAiRating === "negative" ? null : "negative")}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackAiRating === "negative"
                        ? "border-red-200 bg-red-50 text-red-600"
                        : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Poor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Agent Notes</label>
                <input
                  type="text"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Any notes on this lead..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <Button
                size="sm"
                onClick={saveFeedback}
                loading={savingFeedback}
                disabled={!feedbackOutcome && !feedbackAiRating && !feedbackNotes}
              >
                <CheckCircle className="h-4 w-4" />
                Save Feedback
              </Button>
            </div>
          </Card>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2">
          <Card padding={false} className="h-[600px] flex flex-col">
            <ConversationThread
              tenantId={tenant?.tenantId || ""}
              leadId={leadId || ""}
              leadName={lead.contact.name || "Unknown"}
              aiActive={lead.conversation.aiActive}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
