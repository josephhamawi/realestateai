import React, { useState } from "react";
import { Button } from "../common/Button";
import { DUBAI_DEFAULTS } from "../../lib/marketConfig";

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
  loading?: boolean;
}

export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  source: string;
  propertyType: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  desiredAreas: string[];
  notes: string;
}

export function LeadForm({ onSubmit, loading }: LeadFormProps) {
  const marketDefaults = DUBAI_DEFAULTS;

  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    phone: marketDefaults.phonePrefix,
    email: "",
    source: "manual",
    propertyType: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    desiredAreas: [],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof LeadFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone (E.164)</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder={`${marketDefaults.phonePrefix}...`}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Source</label>
          <select
            value={formData.source}
            onChange={(e) => updateField("source", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="manual">Manual Entry</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="referral">Referral</option>
            <option value="property_finder">Property Finder</option>
            <option value="bayut">Bayut</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Type</label>
          <select
            value={formData.propertyType}
            onChange={(e) => updateField("propertyType", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select type</option>
            {marketDefaults.propertyTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timeline</label>
          <select
            value={formData.timeline}
            onChange={(e) => updateField("timeline", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select timeline</option>
            <option value="immediate">Immediate</option>
            <option value="1-3months">1-3 Months</option>
            <option value="3-6months">3-6 Months</option>
            <option value="6months+">6+ Months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Budget Min ({marketDefaults.currency.code})
          </label>
          <input
            type="number"
            value={formData.budgetMin}
            onChange={(e) => updateField("budgetMin", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Budget Max ({marketDefaults.currency.code})
          </label>
          <input
            type="number"
            value={formData.budgetMax}
            onChange={(e) => updateField("budgetMax", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          Create Lead
        </Button>
      </div>
    </form>
  );
}
