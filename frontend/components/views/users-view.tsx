'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  UserPlus,
  ShieldCheck,
  Shield,
  FolderGit2,
  CheckSquare,
  Clock,
  Eye,
  Edit2,
  Lock,
  Unlock,
  Mail,
  Copy,
  Check,
  Filter,
  KeyRound,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { UserItem, UserSummaryKPI, DashboardUser, DashboardRole } from '@/lib/types';
import { formatDate, formatHours } from '@/lib/utils';

interface UsersViewProps {
  // OpenProject Users
  users: UserItem[];
  summary: UserSummaryKPI | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  onExportCSV: () => void;
  onAddUser: () => void;
  onEditUser: (user: UserItem) => void;
  onViewDetail: (id: number) => void;
  onToggleStatus: (user: UserItem) => void;
  isLoading: boolean;

  // Dashboard Accounts
  dashboardUsers: DashboardUser[];
  onAddDashboardUser: () => void;
  onEditDashboardUser: (user: DashboardUser) => void;
  onDeleteDashboardUser: (user: DashboardUser) => void;
}

export function UsersView({
  users,
  summary,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  onExportCSV,
  onAddUser,
  onEditUser,
  onViewDetail,
  onToggleStatus,
  isLoading,
  dashboardUsers,
  onAddDashboardUser,
  onEditDashboardUser,
  onDeleteDashboardUser,
}: UsersViewProps) {
  const [subTab, setSubTab] = useState<'dashboard_users' | 'openproject_users'>('dashboard_users');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyEmail = (e: React.MouseEvent, id: number, email: string) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string, login: string) => {
    const text = (name || login || 'U').trim();
    const parts = text.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: DashboardRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            👑 Administrator
          </span>
        );
      case 'pm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            💼 Project Manager
          </span>
        );
      case 'member':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            💻 Anggota Tim
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            👁️ Viewer / Direksi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('dashboard_users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              subTab === 'dashboard_users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[var(--surface)] text-[var(--fg2)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
            }`}
          >
            <KeyRound size={14} />
            <span>Akun Login Dashboard</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subTab === 'dashboard_users'
                  ? 'bg-blue-700 text-blue-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--fg3)]'
              }`}
            >
              {dashboardUsers.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('openproject_users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              subTab === 'openproject_users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[var(--surface)] text-[var(--fg2)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
            }`}
          >
            <Users size={14} />
            <span>Anggota Tim OpenProject</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subTab === 'openproject_users'
                  ? 'bg-blue-700 text-blue-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--fg3)]'
              }`}
            >
              {users.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-[var(--fg3)]">
          {subTab === 'dashboard_users'
            ? 'Pengguna yang memiliki kredensial untuk login ke dashboard ini'
            : 'Data live anggota tim dari database PostgreSQL (OpenProject)'}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: DASHBOARD LOGIN ACCOUNTS
          ──────────────────────────────────────────────────────────────────────── */}
      {subTab === 'dashboard_users' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--fg)]">
                Daftar Pengguna yang Dapat Login ke Dashboard
              </span>
              <span className="text-[11px] text-[var(--fg3)]">
                (Diferensiasi hak akses: Admin, PM, Member, Viewer)
              </span>
            </div>

            <button
              onClick={onAddDashboardUser}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <UserPlus size={14} />
              <span>Tambah Akun Dashboard</span>
            </button>
          </div>

          {/* Dashboard Users Table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Hak Akses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Terakhir Login</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {dashboardUsers.map((du) => (
                    <tr key={du.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {getInitials(du.full_name, du.username)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--fg)] truncate">
                              {du.full_name}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--fg3)]">
                              @{du.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[var(--fg2)]">
                        {du.email}
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(du.role)}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-[var(--fg3)]">
                        {du.role === 'admin' && 'Akses penuh ke semua menu & User Management'}
                        {du.role === 'pm' && 'Monitoring proyek, tim, workload, & laporan'}
                        {du.role === 'member' && 'Work Packages, tasks, & kapasitas kerja'}
                        {du.role === 'viewer' && 'Read-only Executive Overview & Laporan'}
                      </td>

                      <td className="py-3 px-4">
                        {du.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Dinonaktifkan
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-[var(--fg3)]">
                        {du.last_login_at ? formatDate(du.last_login_at) : 'Belum pernah login'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditDashboardUser(du)}
                            className="p-1.5 rounded-md text-[var(--fg3)] hover:text-blue-600 hover:bg-[var(--surface2)] transition-colors"
                            title="Edit Akun"
                          >
                            <Edit2 size={14} />
                          </button>
                          {du.id !== 1 && (
                            <button
                              onClick={() => onDeleteDashboardUser(du)}
                              className="p-1.5 rounded-md text-[var(--fg3)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: OPENPROJECT LIVE DATA MEMBERS
          ──────────────────────────────────────────────────────────────────────── */}
      {subTab === 'openproject_users' && (
        <div className="space-y-6">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Users size={14} className="text-blue-600" /> Total Pengguna
              </div>
              <div className="text-2xl font-bold text-[var(--fg)]">
                {summary?.total_users ?? users.length}
              </div>
              <div className="text-[10px] text-[var(--fg3)] mt-1">Seluruh anggota terdaftar</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aktif
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary?.active_users ?? 0}
              </div>
              <div className="text-[10px] text-[var(--fg3)] mt-1">Dapat login & beraktivitas</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <ShieldCheck size={14} className="text-purple-600" /> Administrator
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary?.admin_users ?? 0}
              </div>
              <div className="text-[10px] text-[var(--fg3)] mt-1">Akses penuh sistem</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Terundang
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary?.invited_users ?? 0}
              </div>
              <div className="text-[10px] text-[var(--fg3)] mt-1">Menunggu aktivasi akun</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Clock size={14} className="text-indigo-600" /> Total Jam Log
              </div>
              <div className="text-2xl font-bold text-[var(--fg)]">
                {summary?.total_hours_logged ? formatHours(summary.total_hours_logged) : '0h'}
              </div>
              <div className="text-[10px] text-[var(--fg3)] mt-1">Realisasi kerja seluruh tim</div>
            </div>
          </div>

          {/* Toolbar / Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
                <input
                  type="text"
                  placeholder="Cari nama, login, email..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="1">🟢 Aktif</option>
                <option value="4">🟡 Terundang</option>
                <option value="3">🔴 Dinonaktifkan</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Peran</option>
                <option value="admin">Administrator</option>
                <option value="member">Anggota Tim</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--fg)] shadow-sm"
                title="Download data pengguna dalam format CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onAddUser}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              >
                <UserPlus size={14} />
                <span>Tambah Pengguna</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Kontak Email</th>
                    <th className="py-3 px-4">Peran & Akses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Projects</th>
                    <th className="py-3 px-4 text-center">Work Packages</th>
                    <th className="py-3 px-4 text-right">Jam Log</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-[var(--fg3)] font-medium">
                        Memuat daftar pengguna...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-[var(--fg3)]">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => onViewDetail(u.id)}
                        className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                      >
                        {/* User profile */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                              {getInitials(u.name, u.login)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--fg)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[170px]">
                                {u.name}
                              </div>
                              <div className="text-[11px] font-mono text-[var(--fg3)] truncate">
                                @{u.login}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4">
                          {u.email ? (
                            <div className="flex items-center gap-1.5 text-[var(--fg2)]">
                              <span className="truncate max-w-[180px]">{u.email}</span>
                              <button
                                onClick={(e) => handleCopyEmail(e, u.id, u.email)}
                                className="p-1 rounded text-[var(--fg3)] hover:text-[var(--fg)] hover:bg-[var(--surface2)] transition-colors"
                                title="Salin email"
                              >
                                {copiedId === u.id ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[var(--fg3)] italic">—</span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          {u.admin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                              <ShieldCheck size={11} /> Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              Anggota Tim
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {u.status === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif
                            </span>
                          ) : u.status === 4 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Terundang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Dinonaktifkan
                            </span>
                          )}
                        </td>

                        {/* Projects Involved */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 flex-shrink-0">
                              <FolderGit2 size={10} /> {u.project_count}
                            </span>
                            {u.projects && u.projects.length > 0 && (
                              <span className="text-[11px] text-[var(--fg3)] truncate" title={u.projects.join(', ')}>
                                {u.projects.slice(0, 2).join(', ')}
                                {u.projects.length > 2 && ` (+${u.projects.length - 2})`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Work Packages */}
                        <td className="py-3 px-4 text-center font-mono text-[11px]">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-semibold text-amber-600 dark:text-amber-400" title="Open tasks">
                              {u.open_tasks}
                            </span>
                            <span className="text-[var(--fg3)]">/</span>
                            <span className="text-emerald-600 dark:text-emerald-400" title="Closed tasks">
                              {u.closed_tasks}
                            </span>
                          </div>
                        </td>

                        {/* Spent Hours */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--fg)]">
                          {formatHours(u.spent_hours)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onViewDetail(u.id)}
                              className="p-1.5 rounded-md text-[var(--fg3)] hover:text-blue-600 hover:bg-[var(--surface2)] transition-colors"
                              title="Lihat Detail Pengguna"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => onEditUser(u)}
                              className="p-1.5 rounded-md text-[var(--fg3)] hover:text-indigo-600 hover:bg-[var(--surface2)] transition-colors"
                              title="Edit Informasi Pengguna"
                            >
                              <Edit2 size={14} />
                            </button>
                            {u.id !== 4 && (
                              <button
                                onClick={() => onToggleStatus(u)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  u.status === 1
                                    ? 'text-[var(--fg3)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                    : 'text-[var(--fg3)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                                title={u.status === 1 ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              >
                                {u.status === 1 ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
