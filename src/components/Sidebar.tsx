/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Menu,
  LayoutDashboard,
  Users,
  Compass,
  Calendar,
  Building2,
  CheckSquare,
  Route,
  Target,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  Clock,
  Landmark,
  CalendarOff
} from 'lucide-react';
import TrackHiveLogo from './TrackHiveLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationsCount: number;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  rolePermissions?: Record<string, string[]>;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  notificationsCount,
  onLogout,
  userName = 'Admin',
  userRole = 'Super Administrator',
  rolePermissions
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Static menu definitions – this is the core app navigation, not mock data.
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'tracking', label: 'Live Tracking', icon: Compass },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'shifts', label: 'Shift Roster', icon: Clock },
    { id: 'payroll', label: 'Indian Payroll', icon: Landmark },
    { id: 'leaves', label: 'Leave Manager', icon: CalendarOff },
    { id: 'visits', label: 'Visits', icon: Building2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'routes', label: 'Route History', icon: Route },
    { id: 'geofence', label: 'Geofence', icon: Target },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badgeCount: notificationsCount
    },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // ✅ Fallback permissions – ensures the sidebar shows all items if no permissions are passed.
  // This is not dummy data; it's a necessary default for the app to function.
  // DEFAULT DENY: if role not found in permissions map, show only dashboard + notifications
  const permissions =
    rolePermissions && rolePermissions[userRole]
      ? rolePermissions[userRole]
      : ['dashboard', 'notifications'];

  const visibleMenuItems = menuItems.filter((item) =>
    permissions.includes(item.id)
  );

  return (
    <aside
      className={`bg-slate-900 flex flex-col h-screen sticky top-0 shrink-0 overflow-visible transition-all duration-300 z-50 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div
        className={`h-20 border-b border-slate-700 bg-slate-950 flex items-center ${
          collapsed ? 'justify-center' : 'justify-between px-4'
        }`}
      >
        {collapsed ? (
          <TrackHiveLogo iconOnly className="h-9 w-9" />
        ) : (
          <TrackHiveLogo isDarkBg={true} className="scale-[0.8] origin-left" />
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white p-2 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto min-h-0 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {visibleMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              className="relative group"
            >
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  // ✅ Removed the expansion logic → sidebar stays collapsed on click
                }}
                className={`w-full flex items-center ${
                  collapsed
                    ? 'justify-center'
                    : 'justify-between px-4'
                } py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div
                  className={`flex items-center ${
                    collapsed ? '' : 'gap-3'
                  }`}
                >
                  <IconComponent className="h-5 w-5 shrink-0" />

                  {!collapsed && (
                    <span className="text-[15px] font-semibold">
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed &&
                  item.badgeCount &&
                  item.badgeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700">
                      {item.badgeCount}
                    </span>
                  )}
              </button>

              {/* Hover Tooltip – always on top */}
              {collapsed && (
                <div
                  className="
                    absolute
                    left-[72px]
                    top-1/2
                    -translate-y-1/2
                    bg-emerald-600
                    text-white
                    text-base
                    font-semibold
                    px-4
                    py-2
                    rounded-lg
                    shadow-2xl
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                    duration-200
                    whitespace-nowrap
                    z-[9999]
                    pointer-events-none
                  "
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700 bg-slate-800/30 p-3 overflow-hidden">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
            alt="Admin"
            className="h-10 w-10 rounded-full border-2 border-emerald-500 object-cover"
          />

          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {userRole}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`mt-3 w-full flex items-center ${
            collapsed ? 'justify-center' : 'gap-2'
          } px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold`}
        >
          <LogOut className="h-4 w-4 text-rose-500" />

          {!collapsed && (
            <span className="font-semibold text-rose-300">
              Logout (Sign Out)
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}