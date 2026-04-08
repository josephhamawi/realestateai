import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { Card, CardHeader } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Shield, AlertTriangle, Info, XCircle } from "lucide-react";
import { useTenant } from "../hooks/useTenant";
import { formatDateTime } from "../lib/formatters";

interface ComplianceEvent {
  logId: string;
  tenantId: string;
  market: string;
  leadId?: string;
  messageId?: string;
  eventType: string;
  severity: "info" | "warning" | "critical";
  details: {
    description: string;
    violationType?: string;
    resolution?: string;
  };
  timestamp: Timestamp;
}

export function Compliance() {
  const { tenant } = useTenant();
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.tenantId) return;

    const q = query(
      collection(db, "compliance_log"),
      where("tenantId", "==", tenant.tenantId),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ ...d.data(), logId: d.id } as ComplianceEvent)));
      setLoading(false);
    }, () => setLoading(false));

    return unsubscribe;
  }, [tenant?.tenantId]);

  const severityIcon = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    critical: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const severityBadge: Record<string, "info" | "warning" | "danger"> = {
    info: "info",
    warning: "warning",
    critical: "danger",
  };

  const framework = tenant?.config.compliance.framework || "NDPR";
  const criticalCount = events.filter((e) => e.severity === "critical").length;
  const warningCount = events.filter((e) => e.severity === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">
          {framework} compliance audit trail and reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand-600" />
            <div>
              <p className="text-sm text-gray-500">Framework</p>
              <p className="text-lg font-bold text-gray-900">{framework}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-lg font-bold text-yellow-600">{warningCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Critical Events</p>
              <p className="text-lg font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Log */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <CardHeader title="Audit Log" description="Complete compliance event history" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">No compliance events recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.logId} className="flex items-start gap-3 px-5 py-4">
                {severityIcon[event.severity]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {event.eventType.replace(/_/g, " ")}
                    </span>
                    <Badge variant={severityBadge[event.severity]}>
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{event.details.description}</p>
                  {event.details.violationType && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Type: {event.details.violationType.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDateTime(event.timestamp, tenant?.config.timezone)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
