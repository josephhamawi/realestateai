import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadFilters } from "../components/leads/LeadFilters";
import { useLeads, type LeadFilters as LeadFiltersType } from "../hooks/useLeads";

export function Leads() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<LeadFiltersType>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { leads, loading } = useLeads(filters);

  const filteredLeads = searchQuery
    ? leads.filter(
        (l) =>
          l.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.contact.phone?.includes(searchQuery)
      )
    : leads;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your leads
          </p>
        </div>
        <Button onClick={() => navigate("/leads/new")}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <LeadFilters
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <LeadTable leads={filteredLeads} loading={loading} />
      </Card>
    </div>
  );
}
