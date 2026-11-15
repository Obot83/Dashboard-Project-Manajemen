'use client';

import React from 'react';
import { Search, Download, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { WorkPackageItem } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { formatDate } from '@/lib/utils';

interface TasksViewProps {
  tasks: WorkPackageItem[];
  total: number;
  page: number;
  pages: number;
  isOverdueFilter: boolean;
  statusFilter: string;
  searchTerm: string;
  onPageChange: (newPage: number) => void;
  onStatusFilterChange: (status: string) => void;
  onOverdueFilterToggle: (isOverdue: boolean) => void;
  onSearchChange: (search: string) => void;
  onExportCSV: () => void;
  onOpenTaskModal: (id: number) => void;
}

const STATUS_OPTIONS = ['In progress', 'New', 'Developed', 'Tested', 'Closed'];

export function TasksView({
  tasks,
  total,
  page,
  pages,
  isOverdueFilter,
  statusFilter,
  searchTerm,
  onPageChange,
  onStatusFilterChange,
  onOverdueFilterToggle,
  onSearchChange,
  onExportCSV,
  onOpenTaskModal,
}: TasksViewProps) {
  return (
    <div className="space-y-4">
      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => {
              onOverdueFilterToggle(false);
              onStatusFilterChange('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              !isOverdueFilter && !statusFilter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[var(--surface)] text-[var(--fg2)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            Semua
          </button>

          {/* Overdue filter */}
          <button
            onClick={() => {
              onOverdueFilterToggle(true);
              onStatusFilterChange('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              isOverdueFilter
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50 hover:bg-rose-100'
            }`}
          >
            <AlertCircle size={13} />
            <span>Overdue Tasks</span>
          </button>

          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                onOverdueFilterToggle(false);
                onStatusFilterChange(status);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                !isOverdueFilter && statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--fg2)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search & Export CSV */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
            <input
              type="text"
              placeholder="Cari subject, assignee..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 shadow-sm transition-colors"
            />
          </div>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] shadow-sm transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--fg3)] text-xs">
                    Tidak ada work package yang memenuhi filter.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onOpenTaskModal(t.id)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--fg3)]">#{t.id}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--fg)] max-w-xs truncate">
                      {t.subject}
                      {t.days_overdue > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
                          {t.days_overdue}d overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4"><TypeBadge type={t.type} /></td>
                    <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3 px-4 text-xs text-[var(--fg3)] max-w-[150px] truncate">{t.project}</td>
                    <td className="py-3 px-4 text-xs font-medium text-[var(--fg2)]">{t.assignee || '—'}</td>
                    <td className="py-3 px-4 text-xs font-mono">{formatDate(t.due_date)}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {t.done_ratio != null ? `${t.done_ratio}%` : '0%'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
          <div className="text-[var(--fg3)]">
            Menampilkan <span className="font-semibold text-[var(--fg)]">{tasks.length}</span> dari <span className="font-semibold text-[var(--fg)]">{total}</span> items (Halaman {page} dari {pages || 1})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] font-medium disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => onPageChange(Math.min(page + 1, pages))}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] font-medium disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
