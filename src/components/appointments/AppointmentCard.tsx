import React from "react";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "../common/Badge";
import type { AppointmentData } from "../../hooks/useAppointments";

interface AppointmentCardProps {
  appointment: AppointmentData;
  compact?: boolean;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  scheduled: "info",
  confirmed: "success",
  completed: "success",
  cancelled: "danger",
  no_show: "warning",
};

export function AppointmentCard({ appointment, compact = false }: AppointmentCardProps) {
  const date = appointment.scheduledAt?.toDate?.();
  const timeStr = date
    ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)
    : "";

  if (compact) {
    return (
      <div className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700 truncate">
        {timeStr} {appointment.type?.replace(/_/g, " ")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {appointment.type?.replace(/_/g, " ") || "Viewing"}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {date
                ? new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(date)
                : "TBD"}
            </span>
            <span className="text-gray-300">|</span>
            <span>{appointment.duration}min</span>
          </div>
          {appointment.location?.address && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{appointment.location.address}</span>
            </div>
          )}
        </div>
        <Badge variant={statusVariant[appointment.status] || "default"}>
          {appointment.status}
        </Badge>
      </div>
      {appointment.notes && (
        <p className="mt-2 text-xs text-gray-500">{appointment.notes}</p>
      )}
    </div>
  );
}
