import React, { useState } from "react";
import { Card } from "../components/common/Card";
import { CalendarView } from "../components/appointments/CalendarView";
import { AppointmentCard } from "../components/appointments/AppointmentCard";
import { useAppointments } from "../hooks/useAppointments";

export function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { appointments, loading } = useAppointments();

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your scheduled appointments
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Card>
              <CalendarView
                appointments={appointments}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </Card>
          </div>
          <div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming ({upcomingAppointments.length})
              </h3>
              <div className="space-y-3">
                {upcomingAppointments.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-400">
                    No upcoming appointments
                  </p>
                )}
                {upcomingAppointments.map((apt) => (
                  <AppointmentCard key={apt.appointmentId} appointment={apt} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
