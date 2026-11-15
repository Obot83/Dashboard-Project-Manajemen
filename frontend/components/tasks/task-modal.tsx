'use client';

import React from 'react';
import { X, Calendar, Clock, User, Folder, AlertCircle, GitCommit, FileText } from 'lucide-react';
import { WorkPackageDetail } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { formatDate, formatRelativeTime, formatHours } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WorkPackageDetail | null;
  isLoading: boolean;
}

export function TaskModal({ isOpen, onClose, task, isLoading }: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden text-[var(--fg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface2)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[var(--fg)]">
              #{task?.id || '—'}
            </span>
            <h2 className="font-semibold text-sm sm:text-base text-[var(--fg)] truncate">
              {isLoading ? 'Memuat data...' : task?.subject}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--fg3)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {isLoading ? (
            <div className="py-16 text-center text-[var(--fg3)] font-medium">
              Mengambil rincian dari database...
            </div>
          ) : task ? (
            <>
              {/* Overdue Banner if applicable */}
              {task.days_overdue > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300">
                  <AlertCircle size={15} className="flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="font-medium text-xs">
                    Target penyelesaian terlewati <span className="font-bold">{task.days_overdue} hari</span> (Batas waktu: {formatDate(task.due_date)}).
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--fg3)] block mb-1">Status</span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--fg3)] block mb-1">Tipe</span>
                  <TypeBadge type={task.type} />
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--fg3)] block mb-1">Prioritas</span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <span className="text-[10px] uppercase font-semibold text-[var(--fg3)] block mb-1">Progress</span>
                  <span className="font-mono font-semibold text-[var(--fg)]">{task.done_ratio != null ? `${task.done_ratio}%` : '0%'}</span>
                </div>
              </div>

              {/* Personnel & Project Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <div className="text-[10px] uppercase font-semibold text-[var(--fg3)] flex items-center gap-1 mb-1">
                    <Folder size={11} /> Project
                  </div>
                  <div className="font-medium text-[var(--fg)] truncate">{task.project}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <div className="text-[10px] uppercase font-semibold text-[var(--fg3)] flex items-center gap-1 mb-1">
                    <User size={11} /> Assignee
                  </div>
                  <div className="font-medium text-[var(--fg)] truncate">{task.assignee || 'Unassigned'}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                  <div className="text-[10px] uppercase font-semibold text-[var(--fg3)] flex items-center gap-1 mb-1">
                    <Clock size={11} /> Hours Logged
                  </div>
                  <div className="font-mono font-medium text-[var(--fg)]">
                    {formatHours(task.spent_hours)} {task.estimated_hours ? `/ ${formatHours(task.estimated_hours)} est.` : ''}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText size={12} /> Deskripsi
                </h4>
                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-xs text-[var(--fg2)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {task.description ? task.description : <span className="text-[var(--fg3)] italic">Tidak ada deskripsi rinci untuk item ini.</span>}
                </div>
              </div>

              {/* Custom Fields */}
              {task.custom_fields && task.custom_fields.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider mb-1.5">
                    Field Kustom OpenProject
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {task.custom_fields.map((cf) => (
                      <div key={cf.name} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-xs flex justify-between items-center">
                        <span className="text-[var(--fg3)]">{cf.name}</span>
                        <span className="font-mono font-medium text-[var(--fg)]">{cf.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journals / Audit Trail */}
              {task.journals && task.journals.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <GitCommit size={12} /> Riwayat Audit Terakhir
                  </h4>
                  <div className="space-y-1.5">
                    {task.journals.map((j) => (
                      <div key={j.id} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[var(--fg)] font-medium">
                            {j.notes ? j.notes : `Pembaruan data versi ${j.version}`}
                          </span>
                          <span className="text-[11px] text-[var(--fg3)] block">
                            Oleh {j.author || 'Sistem'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--fg3)] whitespace-nowrap">
                          {formatRelativeTime(j.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
