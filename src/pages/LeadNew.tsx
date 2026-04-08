import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { Card } from "../components/common/Card";
import { LeadForm, type LeadFormData } from "../components/leads/LeadForm";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { toast } from "../components/common/Toast";

export function LeadNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: LeadFormData) => {
    if (!user || !tenant) return;
    setLoading(true);
    try {
      const leadRef = await addDoc(
        collection(db, `tenants/${user.uid}/leads`),
        {
          tenantId: user.uid,
          market: tenant.market,
          source: data.source,
          status: "new",
          contact: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            preferredLanguage: "en",
          },
          propertyInterest: {
            type: "buy",
            propertyType: data.propertyType || null,
            budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
            budgetMax: data.budgetMax ? Number(data.budgetMax) : null,
            timeline: data.timeline || null,
            desiredAreas: data.desiredAreas || [],
          },
          qualification: {
            score: 0,
            status: "new",
            urgency: "cold",
          },
          conversation: {
            channel: "manual",
            lastMessageAt: null,
            messageCount: 0,
            aiActive: true,
          },
          notes: data.notes || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      toast("success", "Lead created", `${data.name} added to your pipeline`);
      navigate(`/leads/${leadRef.id}`);
    } catch (err) {
      console.error("Failed to create lead:", err);
      toast("error", "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/leads")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manually add a lead from a call, referral, or meeting
          </p>
        </div>
      </div>
      <Card>
        <LeadForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
}
