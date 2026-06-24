import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  Activity,
} from "lucide-react";
import { LogoMark } from "../brand/LogoMark";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/calendar", icon: Calendar, label: "Appointments" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/usage", icon: Activity, label: "Usage" },
  { path: "/billing", icon: CreditCard, label: "Billing" },
  { path: "/compliance", icon: Shield, label: "Compliance" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <LogoMark className="h-8 w-8 flex-shrink-0" />
        {!collapsed && (
          <span className="text-xl font-bold text-gray-900">AgentFlow</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="rounded-lg bg-brand-50 p-3">
          {!collapsed && (
            <>
              <p className="text-xs font-medium text-brand-700">AI Assistant</p>
              <p className="mt-1 text-xs text-brand-600">Active & Learning</p>
            </>
          )}
          {collapsed && <LogoMark className="h-5 w-5 mx-auto" />}
        </div>
      </div>
    </aside>
  );
}
