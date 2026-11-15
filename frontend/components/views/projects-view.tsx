'use client';

import React from 'react';
import { Search, Download, FolderGit2 } from 'lucide-react';
import { ProjectItem } from '@/lib/types';
import { HealthBadge } from '@/components/ui/health-badge';
import { formatDate, formatHours } from '@/lib/utils';

interface ProjectsViewProps {
  projects: ProjectItem[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onExportCSV: () => void;
  onSelectProject: (id: number) => void;
}

export function ProjectsView({
  projects,
  searchTerm,
  onSearchChange,
  onExportCSV,
  onSelectProject,
}: ProjectsViewProps) {
  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
          <input
            type="text"
            placeholder="Cari project atau identifier..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 shadow-sm transition-colors"
          />
        </div>

        <button
          onClick={onExportCSV}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Projects Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Nama Project</th>
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4 text-center">Total Item</th>
                <th className="py-3 px-4 text-center">Closed</th>
                <th className="py-3 px-4">Progress Penyelesaian</th>
                <th className="py-3 px-4 text-right">Est. Jam</th>
                <th className="py-3 px-4 text-right">Jam Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--fg3)] text-xs">
                    Tidak ada project yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                    title="Klik untuk memfilter dashboard ke project ini"
                  >
                    <td className="py-3 px-4">{getHealthBadge(p.health, p.health_label)}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--fg)]">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--fg3)]">{p.identifier}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{p.wp_count}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {p.closed_count}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(p.close_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium text-[var(--fg3)]">
                          {p.close_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--fg3)]">{formatHours(p.estimated_hours)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {formatHours(p.spent_hours)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getHealthBadge(health: 'good' | 'warning' | 'critical', label: string) {
  return <HealthBadge health={health} label={label} />;
}
