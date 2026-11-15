'use client';

import React from 'react';
import { Users2, Clock, Scale } from 'lucide-react';
import { WorkloadItem, TimeTrackingResponse } from '@/lib/types';
import { formatHours } from '@/lib/utils';

interface WorkloadViewProps {
  workload: WorkloadItem[];
  timeTracking: TimeTrackingResponse | null;
}

export function WorkloadView({ workload, timeTracking }: WorkloadViewProps) {
  const maxOpenTasks = Math.max(...workload.map((i) => i.open_tasks), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Open Tasks per Member */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-1 flex items-center gap-2">
            <Users2 size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Kapasitas & Beban Kerja Tim</span>
          </h3>
          <p className="text-xs text-[var(--fg3)] mb-4">Total penugasan task aktif yang belum selesai</p>

          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {workload.map((w) => (
              <div key={w.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[var(--fg)]">{w.name}</span>
                  <span className="font-mono font-medium text-[var(--fg2)]">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{w.open_tasks}</span> open / {w.total_tasks} total
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                    style={{ width: `${(w.open_tasks / maxOpenTasks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Logged Hours */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-1 flex items-center gap-2">
            <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Jam Kerja Tercatat per Personel</span>
          </h3>
          <p className="text-xs text-[var(--fg3)] mb-4">Akumulasi waktu kerja aktual dari entri time logs</p>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {timeTracking?.by_user.map((u) => (
              <div
                key={u.user_name}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[var(--fg)]">{u.user_name}</div>
                  <div className="text-[11px] text-[var(--fg3)] mt-0.5">{u.log_count} log entri tercatat</div>
                </div>
                <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatHours(u.total_hours)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget & Hours Tracking */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-1 flex items-center gap-2">
          <Scale size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>Tracking Estimasi vs Realisasi Waktu (Budget)</span>
        </h3>
        <p className="text-xs text-[var(--fg3)] mb-4">
          Perbandingan alokasi estimasi durasi dengan realisasi waktu kerja yang digunakan per project
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Nama Project</th>
                <th className="py-3 px-4 text-right">Estimasi</th>
                <th className="py-3 px-4 text-right">Realisasi (Log)</th>
                <th className="py-3 px-4">Rasio Pemakaian</th>
                <th className="py-3 px-4">Status Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {timeTracking?.by_project.map((p) => {
                const ratio = p.estimated_hours > 0 ? (p.spent_hours / p.estimated_hours) * 100 : null;
                let badge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                    On Track
                  </span>
                );

                if (p.estimated_hours > 0 && p.spent_hours > p.estimated_hours) {
                  badge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
                      Over Budget
                    </span>
                  );
                } else if (ratio !== null && ratio >= 85) {
                  badge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                      Near Budget
                    </span>
                  );
                }

                return (
                  <tr key={p.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-3 px-4 font-semibold text-[var(--fg)]">{p.name}</td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--fg3)]">{formatHours(p.estimated_hours)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {formatHours(p.spent_hours)}
                    </td>
                    <td className="py-3 px-4">
                      {ratio !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ratio > 100 ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium">{Math.round(ratio)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--fg3)] font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
