'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  ShieldCheck,
  FolderGit2,
  CheckSquare,
  Clock,
  Calendar,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { UserDetail, UserTaskItem } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { formatDate, formatHours } from '@/lib/utils';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDetail: UserDetail | null;
  isLoading: boolean;
  onOpenTaskModal?: (taskId: number) => void;
}

export function UserDetailModal({
  isOpen,
  onClose,
  userDetail,
  isLoading,
  onOpenTaskModal,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'logs'>('projects');
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const user = userDetail?.user;

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getInitials = (name: string, login: string) => {
    const text = (name || login || 'U').trim();
    const parts = text.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--fg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--surface2)]">
          {isLoading || !user ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                {getInitials(user.name, user.login)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-base sm:text-lg text-[var(--fg)] truncate">
                    {user.name}
                  </h2>
                  {user.admin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                      <ShieldCheck size={11} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      Anggota Tim
                    </span>
                  )}
                  {user.status === 1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif
                    </span>
                  ) : user.status === 4 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Terundang
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Dinonaktifkan
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--fg3)] mt-1 flex-wrap">
                  <span className="font-mono text-[11px]">@{user.login}</span>
                  {user.email && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyEmail(user.email)}
                        className="inline-flex items-center gap-1 hover:text-[var(--fg)] transition-colors group"
                        title="Salin email"
                      >
                        <Mail size={12} />
                        <span>{user.email}</span>
                        {copiedEmail ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg3)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors flex-shrink-0"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !user ? (
            <div className="py-20 text-center text-xs text-[var(--fg3)]">
              Memuat detail lengkap pengguna...
            </div>
          ) : (
            <>
              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--fg3)] flex items-center gap-1.5 mb-1">
                    <FolderGit2 size={13} className="text-blue-600" /> Projects
                  </div>
                  <div className="text-lg font-bold text-[var(--fg)]">
                    {userDetail.projects?.length ?? user.project_count}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--fg3)] flex items-center gap-1.5 mb-1">
                    <CheckSquare size={13} className="text-indigo-600" /> Open Tasks
                  </div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {user.open_tasks}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--fg3)] flex items-center gap-1.5 mb-1">
                    <CheckSquare size={13} className="text-emerald-600" /> Closed
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {user.closed_tasks}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--fg3)] flex items-center gap-1.5 mb-1">
                    <Clock size={13} className="text-cyan-600" /> Jam Log
                  </div>
                  <div className="text-lg font-bold text-[var(--fg)]">
                    {formatHours(user.spent_hours)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-[var(--fg3)] flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-violet-600" /> Terakhir Aktif
                  </div>
                  <div className="text-xs font-semibold text-[var(--fg)] truncate mt-1">
                    {user.last_login_on ? formatDate(user.last_login_on) : 'Belum pernah login'}
                  </div>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="border-b border-[var(--border)] flex gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'projects'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-[var(--fg3)] hover:text-[var(--fg)]'
                  }`}
                >
                  <FolderGit2 size={14} />
                  <span>Daftar Project & Peran</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--fg2)]">
                    {userDetail.projects?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'tasks'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-[var(--fg3)] hover:text-[var(--fg)]'
                  }`}
                >
                  <CheckSquare size={14} />
                  <span>Work Packages / Tasks</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--fg2)]">
                    {userDetail.tasks?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'logs'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-[var(--fg3)] hover:text-[var(--fg)]'
                  }`}
                >
                  <Clock size={14} />
                  <span>Catatan Waktu (Time Logs)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--fg2)]">
                    {userDetail.time_entries?.length || 0}
                  </span>
                </button>
              </div>

              {/* Tab 1: Projects */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  {(!userDetail.projects || userDetail.projects.length === 0) ? (
                    <div className="py-12 text-center text-xs text-[var(--fg3)] bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                      Pengguna ini belum ditugaskan ke project manapun.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px]">
                            <th className="py-2.5 px-3.5">Nama Project</th>
                            <th className="py-2.5 px-3.5">Identifier</th>
                            <th className="py-2.5 px-3.5">Peran / Role</th>
                            <th className="py-2.5 px-3.5 text-right">Ditambahkan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {userDetail.projects.map((p) => (
                            <tr key={p.project_id} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="py-2.5 px-3.5 font-semibold text-[var(--fg)] flex items-center gap-2">
                                <FolderGit2 size={13} className="text-blue-600 flex-shrink-0" />
                                <span>{p.project_name}</span>
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-[11px] text-[var(--fg3)]">
                                {p.project_identifier}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {p.role_list && p.role_list.length > 0 ? (
                                    p.role_list.map((r, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                      >
                                        {r}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[var(--fg3)]">{p.roles || 'Member'}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5 text-right text-[var(--fg3)] font-mono text-[11px]">
                                {p.created_at ? formatDate(p.created_at) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Work Packages / Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {(!userDetail.tasks || userDetail.tasks.length === 0) ? (
                    <div className="py-12 text-center text-xs text-[var(--fg3)] bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                      Tidak ada work package yang ditugaskan ke pengguna ini.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px]">
                            <th className="py-2.5 px-3">#ID</th>
                            <th className="py-2.5 px-3">Subject & Project</th>
                            <th className="py-2.5 px-3">Tipe</th>
                            <th className="py-2.5 px-3">Prioritas</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-center">Progress</th>
                            <th className="py-2.5 px-3 text-right">Deadline</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {userDetail.tasks.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => onOpenTaskModal && onOpenTaskModal(t.id)}
                              className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                              title="Klik untuk melihat detail work package"
                            >
                              <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--fg3)]">
                                #{t.id}
                              </td>
                              <td className="py-2.5 px-3 max-w-[200px]">
                                <div className="font-semibold text-[var(--fg)] truncate">{t.subject}</div>
                                <div className="text-[10px] text-[var(--fg3)] truncate">{t.project_name}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <TypeBadge type={t.type} />
                              </td>
                              <td className="py-2.5 px-3">
                                <PriorityBadge priority={t.priority} />
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={t.status} />
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        (t.done_ratio || 0) === 100
                                          ? 'bg-emerald-500'
                                          : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${t.done_ratio || 0}%` }}
                                    />
                                  </div>
                                  <span>{t.done_ratio || 0}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[var(--fg3)]">
                                {t.due_date ? formatDate(t.due_date) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Time Logs */}
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  {(!userDetail.time_entries || userDetail.time_entries.length === 0) ? (
                    <div className="py-12 text-center text-xs text-[var(--fg3)] bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                      Belum ada entri log jam kerja yang dicatat oleh pengguna ini.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px]">
                            <th className="py-2.5 px-3.5">Tanggal</th>
                            <th className="py-2.5 px-3.5">Project & Task</th>
                            <th className="py-2.5 px-3.5 text-right">Jam Kerja</th>
                            <th className="py-2.5 px-3.5">Keterangan / Aktivitas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {userDetail.time_entries.map((te) => (
                            <tr key={te.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="py-2.5 px-3.5 font-mono text-[11px] text-[var(--fg3)] whitespace-nowrap">
                                {formatDate(te.spent_on)}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <div className="font-semibold text-[var(--fg)]">{te.project_name}</div>
                                {te.work_package_subject && (
                                  <div className="text-[10px] text-[var(--fg3)] truncate max-w-xs">
                                    #{te.work_package_id}: {te.work_package_subject}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                {formatHours(te.hours)}
                              </td>
                              <td className="py-2.5 px-3.5 text-[var(--fg2)] text-[11px] max-w-xs truncate">
                                {te.comments || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface2)] text-xs text-[var(--fg3)]">
          <div className="flex items-center gap-2">
            <span>Dibuat:</span>
            <span className="font-mono text-[11px] text-[var(--fg2)]">
              {user?.created_at ? formatDate(user.created_at) : '—'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--fg)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
