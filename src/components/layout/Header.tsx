import React, { useState } from "react";
import { Bell, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTenant } from "../../hooks/useTenant";
import { Badge } from "../common/Badge";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const marketBadgeVariant = tenant?.market === "dubai" ? "info" : "success";

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
            <Badge variant={marketBadgeVariant}>
              {tenant.market === "dubai" ? "Dubai" : "Nigeria"}
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
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-900">
                {tenant?.agent?.name || user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
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
          )}
        </div>
      </div>
    </header>
  );
}
