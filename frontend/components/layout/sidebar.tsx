'use client';

import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Milestone,
  Users2,
  LineChart,
  UserCog,
  X,
  Layers,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardUser } from '@/lib/types';

export type TabType = 'overview' | 'projects' | 'tasks' | 'milestones' | 'workload' | 'reports' | 'users';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: DashboardUser | null;
  onLogout: () => void;
}

export function Sidebar({ activeTab, onTabChange, isOpen, onClose, currentUser, onLogout }: SidebarProps) {
  const role = currentUser?.role || 'admin';

  // Role-based visibility
  const allOperations = [
    { id: 'overview' as TabType, label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'projects' as TabType, label: 'Projects Registry', icon: FolderGit2 },
    { id: 'tasks' as TabType, label: 'Work Packages', icon: CheckSquare },
  ];

  const allPlanning = [
    { id: 'milestones' as TabType, label: 'Milestones & Roadmap', icon: Milestone },
    { id: 'workload' as TabType, label: 'Workload & Capacity', icon: Users2 },
    { id: 'reports' as TabType, label: 'Analytics & Reports', icon: LineChart },
  ];

  const allAdmin = [
    { id: 'users' as TabType, label: 'User Management', icon: UserCog },
  ];

  // Filter based on role
  const operationsItems = allOperations.filter((it) => {
    if (role === 'viewer') return it.id === 'overview';
    return true;
  });

  const planningItems = allPlanning.filter((it) => {
    if (role === 'viewer') return it.id === 'milestones' || it.id === 'reports';
    if (role === 'member') return it.id === 'workload';
    return true;
  });

  const adminItems = role === 'admin' ? allAdmin : [];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeStyle = (userRole?: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'pm':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'member':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'viewer':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-50 transition-transform duration-200 select-none shadow-sm',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              TOP
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[var(--fg)] tracking-tight truncate flex items-center gap-1.5">
                Teknologi Operator
              </div>
              <div className="text-[11px] text-[var(--fg3)] font-normal truncate">Project Operations</div>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 text-[var(--fg3)] hover:text-[var(--fg)] rounded-md hover:bg-[var(--surface-hover)]"
            onClick={onClose}
            aria-label="Tutup Menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[var(--fg3)] uppercase">
              Operations
            </div>
            <div className="space-y-0.5">
              {operationsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left group',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold'
                        : 'text-[var(--fg2)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--fg3)] group-hover:text-[var(--fg2)]'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[var(--fg3)] uppercase">
              Planning & Insights
            </div>
            <div className="space-y-0.5">
              {planningItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left group',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold'
                        : 'text-[var(--fg2)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--fg3)] group-hover:text-[var(--fg2)]'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[var(--fg3)] uppercase">
              Administration
            </div>
            <div className="space-y-0.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left group',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold'
                        : 'text-[var(--fg2)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--fg3)] group-hover:text-[var(--fg2)]'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                {getInitials(currentUser?.full_name || currentUser?.username)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--fg)] truncate">
                  {currentUser?.full_name || 'Deni Permana'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded font-semibold border',
                      getRoleBadgeStyle(currentUser?.role)
                    )}
                  >
                    {currentUser?.role_label || 'Administrator'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[var(--fg3)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
              title="Keluar (Logout)"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
