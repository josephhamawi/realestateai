import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User, Menu, Users, CalendarCheck, AlertTriangle, MessageSquare, X } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTenant } from "../../hooks/useTenant";
import { Badge } from "../common/Badge";
import { formatRelativeTime } from "../../lib/formatters";

interface Notification {
  id: string;
  type: "new_lead" | "appointment" | "escalation" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: unknown;
  leadId?: string;
}

const notifIcons: Record<string, React.ReactNode> = {
  new_lead: <Users className="h-4 w-4 text-brand-600" />,
  appointment: <CalendarCheck className="h-4 w-4 text-green-600" />,
  escalation: <AlertTriangle className="h-4 w-4 text-red-500" />,
  system: <MessageSquare className="h-4 w-4 text-gray-500" />,
};

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to real-time notifications from leads (new leads + appointments)
  useEffect(() => {
    if (!tenant?.tenantId) return;

    // Listen to recent leads as notifications
    const leadsQuery = query(
      collection(db, `tenants/${tenant.tenantId}/leads`),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
      const notifs: Notification[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const createdAt = data.createdAt;

        // New lead notification
        notifs.push({
          id: `lead-${d.id}`,
          type: "new_lead",
          title: "New lead",
          message: `${data.contact?.name || "Unknown"} via ${data.conversation?.channel || data.source || "unknown"}`,
          read: data._notifRead || false,
          createdAt,
          leadId: d.id,
        });

        // Appointment notification
        if (data.status === "appointment_set") {
          notifs.push({
            id: `appt-${d.id}`,
            type: "appointment",
            title: "Appointment booked",
            message: `Viewing scheduled with ${data.contact?.name || "lead"}`,
            read: data._apptNotifRead || false,
            createdAt: data.updatedAt || createdAt,
            leadId: d.id,
          });
        }

        // Escalation notification
        if (data.qualification?.readiness?.agentReady) {
          notifs.push({
            id: `esc-${d.id}`,
            type: "escalation",
            title: "Lead escalated",
            message: `${data.contact?.name || "Lead"} needs your attention`,
            read: data._escNotifRead || false,
            createdAt: data.updatedAt || createdAt,
            leadId: d.id,
          });
        }
      });

      // Sort by most recent
      notifs.sort((a, b) => {
        const aTime = (a.createdAt as { seconds?: number })?.seconds || 0;
        const bTime = (b.createdAt as { seconds?: number })?.seconds || 0;
        return bTime - aTime;
      });

      setNotifications(notifs.slice(0, 15));
    }, () => {
      // Silently fail if query needs an index
    });

    return unsubscribe;
  }, [tenant?.tenantId]);

  const markAllRead = async () => {
    if (!tenant?.tenantId) return;
    const unreadLeadIds = new Set<string>();
    notifications.filter((n) => !n.read && n.leadId).forEach((n) => unreadLeadIds.add(n.leadId!));

    for (const leadId of unreadLeadIds) {
      try {
        await updateDoc(doc(db, `tenants/${tenant.tenantId}/leads`, leadId), {
          _notifRead: true,
          _apptNotifRead: true,
          _escNotifRead: true,
        });
      } catch { /* ignore */ }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {tenant && (
          <div className="flex items-center gap-2">
            <Badge variant="info">
              Dubai
            </Badge>
            <Badge
              variant={
                tenant.status === "active"
                  ? "success"
                  : tenant.status === "trial"
                  ? "warning"
                  : "danger"
              }
            >
              {tenant.status}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="mx-auto h-8 w-8 text-gray-200" />
                      <p className="mt-2 text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (notif.leadId) navigate(`/leads/${notif.leadId}`);
                          setShowNotifications(false);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          !notif.read ? "bg-brand-50/50" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notifIcons[notif.type] || notifIcons.system}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {formatRelativeTime(notif.createdAt as Date)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            {(tenant?.agent as Record<string, unknown>)?.avatarUrl ? (
              <img
                src={(tenant?.agent as Record<string, unknown>)?.avatarUrl as string}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-900">
                {tenant?.agent?.name || user?.email || "User"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                <a
                  href="/settings/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  Profile Settings
                </a>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
