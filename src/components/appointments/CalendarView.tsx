import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentCard } from "./AppointmentCard";
import type { AppointmentData } from "../../hooks/useAppointments";

interface CalendarViewProps {
  appointments: AppointmentData[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarView({
  appointments,
  currentDate,
  onDateChange,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [firstDayOfWeek, daysInMonth]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<number, AppointmentData[]> = {};
    for (const apt of appointments) {
      const d = apt.scheduledAt?.toDate?.();
      if (d && d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(apt);
      }
    }
    return map;
  }, [appointments, month, year]);

  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    currentDate
  );

  const prevMonth = () => onDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onDateChange(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200 overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dow) => (
          <div key={dow} className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500">
            {dow}
          </div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            className={`min-h-[100px] bg-white p-1.5 ${day ? "" : "bg-gray-50"}`}
          >
            {day && (
              <>
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday(day) ? "bg-brand-600 text-white" : "text-gray-700"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {(appointmentsByDay[day] || []).slice(0, 2).map((apt) => (
                    <AppointmentCard key={apt.appointmentId} appointment={apt} compact />
                  ))}
                  {(appointmentsByDay[day]?.length || 0) > 2 && (
                    <span className="text-xs text-gray-500">
                      +{appointmentsByDay[day].length - 2} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
