'use client';

import React from 'react';
import { ReportsSummaryResponse } from '@/lib/types';
import { formatHours } from '@/lib/utils';

interface ReportsViewProps {
  reports: ReportsSummaryResponse | null;
}

export function ReportsView({ reports }: ReportsViewProps) {
  const stats = reports?.stats;
  const total = stats?.total_items || 1;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">Total Defect (Bug)</div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5">{stats?.bug_count ?? 0}</div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">
            {stats ? ((stats.bug_count / total) * 100).toFixed(1) : 0}% dari total
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">User Stories</div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1.5">{stats?.story_count ?? 0}</div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">
            {stats ? ((stats.story_count / total) * 100).toFixed(1) : 0}% dari total
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">On Hold</div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">{stats?.on_hold_count ?? 0}</div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">item ditangguhkan</div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">Rejected</div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1.5">{stats?.rejected_count ?? 0}</div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">item ditolak</div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">Total Est. Jam</div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1.5">
            {formatHours(stats?.total_estimated_hours)}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">estimasi tim</div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">Total Jam Log</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatHours(reports?.total_spent_hours)}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">jam kerja aktual</div>
        </div>
      </div>

      {/* Top 10 Projects Progress Breakdown */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-1">
          Top 10 Project berdasarkan Volume Pekerjaan
        </h3>
        <p className="text-xs text-[var(--fg3)] mb-4">Perbandingan jumlah item terselesaikan dengan total volume</p>

        <div className="space-y-3.5">
          {reports?.top_projects.map((p) => {
            const rate = p.total > 0 ? Math.round((p.closed / p.total) * 100) : 0;
            return (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[var(--fg)]">{p.name}</span>
                  <span className="font-mono text-[var(--fg3)]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{rate}%</span> ({p.closed}/{p.total} selesai)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
