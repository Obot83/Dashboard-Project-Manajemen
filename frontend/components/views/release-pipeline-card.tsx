'use client';

import React, { useState, useMemo } from 'react';
import {
  Rocket,
  FlaskConical,
  Code2,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ReleasePipelineResponse, ReleaseProjectItem, ReleasePipelineItem } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { formatRelativeTime, formatDate } from '@/lib/utils';

interface ReleasePipelineCardProps {
  data: ReleasePipelineResponse | null;
  onOpenTaskModal: (id: number) => void;
  onSelectProject?: (id: number) => void;
}

type TabMode = 'projects' | 'all_items' | 'ready_to_prod' | 'uat' | 'developed';

export function ReleasePipelineCard({
  data,
  onOpenTaskModal,
  onSelectProject,
}: ReleasePipelineCardProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('projects');
  const [searchTerm, setSearchTerm] = useState('');

  const summary = data?.summary ?? {
    ready_to_prod_total: 0,
    uat_total: 0,
    developed_total: 0,
    projects_count: 0,
  };

  const projects = data?.projects ?? [];
  const items = data?.items ?? [];

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.identifier.toLowerCase().includes(q)
    );
  }, [projects, searchTerm]);

  // Filtered items based on tab & search
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'ready_to_prod') {
      result = items.filter((it) => it.stage === 'ready_to_prod');
    } else if (activeTab === 'uat') {
      result = items.filter((it) => it.stage === 'uat');
    } else if (activeTab === 'developed') {
      result = items.filter((it) => it.stage === 'developed');
    }

    if (!searchTerm.trim()) return result;
    const q = searchTerm.toLowerCase();
    return result.filter(
      (it) =>
        it.subject.toLowerCase().includes(q) ||
        it.project.toLowerCase().includes(q) ||
        (it.assignee && it.assignee.toLowerCase().includes(q)) ||
        it.id.toString().includes(q)
    );
  }, [items, activeTab, searchTerm]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden flex flex-col">
      {/* Header with Title & Quick Summary Stats */}
      <div className="p-5 border-b border-[var(--border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-900/40">
              Release Pipeline
            </span>
            <span className="text-xs text-[var(--fg3)]">•</span>
            <span className="text-xs text-[var(--fg3)] font-medium">
              {summary.projects_count} Proyek Terlibat
            </span>
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-[var(--fg)] mt-1 tracking-tight">
            Kesiapan Rilis: Ready to Production & UAT
          </h3>
          <p className="text-xs text-[var(--fg3)] mt-0.5">
            Pelacakan terpusat pekerjaan di tahap UAT/Testing dan yang telah siap rilis ke Production.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('ready_to_prod')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'ready_to_prod'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/40 hover:bg-emerald-100/70'
            }`}
          >
            <Rocket size={13} className={activeTab === 'ready_to_prod' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />
            <span>Ready to Prod:</span>
            <span className="font-mono font-bold">{summary.ready_to_prod_total}</span>
          </button>

          <button
            onClick={() => setActiveTab('uat')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'uat'
                ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                : 'bg-sky-50/70 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-sky-200/70 dark:border-sky-900/40 hover:bg-sky-100/70'
            }`}
          >
            <FlaskConical size={13} className={activeTab === 'uat' ? 'text-white' : 'text-sky-600 dark:text-sky-400'} />
            <span>In UAT & Testing:</span>
            <span className="font-mono font-bold">{summary.uat_total}</span>
          </button>

          <button
            onClick={() => setActiveTab('developed')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'developed'
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/40 hover:bg-amber-100/70'
            }`}
          >
            <Code2 size={13} className={activeTab === 'developed' ? 'text-white' : 'text-amber-600 dark:text-amber-400'} />
            <span>Developed (Antri):</span>
            <span className="font-mono font-bold">{summary.developed_total}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface2)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'projects'
                ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--fg3)] hover:text-[var(--fg)]'
            }`}
          >
            Tabel Ringkasan Proyek ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('all_items')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'all_items'
                ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--fg3)] hover:text-[var(--fg)]'
            }`}
          >
            Semua Tiket Pipeline ({items.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
          <input
            type="text"
            placeholder={
              activeTab === 'projects'
                ? 'Cari nama project...'
                : 'Cari subject, project, assignee...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {activeTab === 'projects' ? (
          /* Table 1: Per-Project Matrix */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--surface2)]/70 border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Nama Project</th>
                <th className="py-2.5 px-4 text-center">Ready to Prod</th>
                <th className="py-2.5 px-4 text-center">In UAT / Testing</th>
                <th className="py-2.5 px-4 text-center">Developed (Antri)</th>
                <th className="py-2.5 px-4 text-center">Total Pipeline</th>
                <th className="py-2.5 px-4">Komposisi Kesiapan</th>
                {onSelectProject && <th className="py-2.5 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--fg3)]">
                    Tidak ada proyek dalam pipeline yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const readyPct =
                    p.total_pipeline > 0
                      ? Math.round((p.ready_to_prod_count / p.total_pipeline) * 100)
                      : 0;
                  const uatPct =
                    p.total_pipeline > 0
                      ? Math.round((p.uat_count / p.total_pipeline) * 100)
                      : 0;
                  const devPct =
                    p.total_pipeline > 0
                      ? Math.round((p.developed_count / p.total_pipeline) * 100)
                      : 0;

                  return (
                    <tr
                      key={p.project_id}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--fg)]">{p.project_name}</div>
                        <div className="text-[11px] font-mono text-[var(--fg3)]">{p.identifier}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.ready_to_prod_count > 0 ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[11px] border border-emerald-200/60 dark:border-emerald-900/40">
                            {p.ready_to_prod_count}
                          </span>
                        ) : (
                          <span className="font-mono text-[var(--fg3)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.uat_count > 0 ? (
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded text-[11px] border border-sky-200/60 dark:border-sky-900/40">
                            {p.uat_count}
                          </span>
                        ) : (
                          <span className="font-mono text-[var(--fg3)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.developed_count > 0 ? (
                          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-[11px] border border-amber-200/60 dark:border-amber-900/40">
                            {p.developed_count}
                          </span>
                        ) : (
                          <span className="font-mono text-[var(--fg3)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[var(--fg)]">
                        {p.total_pipeline}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-32">
                          {/* Multi-segment progress bar */}
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            {readyPct > 0 && (
                              <div
                                style={{ width: `${readyPct}%` }}
                                className="h-full bg-emerald-500"
                                title={`Ready to Prod: ${p.ready_to_prod_count} (${readyPct}%)`}
                              />
                            )}
                            {uatPct > 0 && (
                              <div
                                style={{ width: `${uatPct}%` }}
                                className="h-full bg-sky-500"
                                title={`In UAT: ${p.uat_count} (${uatPct}%)`}
                              />
                            )}
                            {devPct > 0 && (
                              <div
                                style={{ width: `${devPct}%` }}
                                className="h-full bg-amber-500"
                                title={`Developed: ${p.developed_count} (${devPct}%)`}
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--fg3)] mt-1 flex justify-between">
                            <span>{p.ready_to_prod_count} Siap Rilis</span>
                            <span>{p.uat_count} UAT</span>
                          </div>
                        </div>
                      </td>
                      {onSelectProject && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectProject(p.project_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--fg2)] hover:text-blue-600 transition-colors"
                            title="Filter dashboard ke project ini"
                          >
                            Filter <ChevronRight size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Table 2: Work Packages List */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--surface2)]/70 border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Tahap Pipeline</th>
                <th className="py-2.5 px-4">Tipe</th>
                <th className="py-2.5 px-4">Prioritas</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Assignee</th>
                <th className="py-2.5 px-4 text-right">Diperbarui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--fg3)]">
                    Tidak ada item yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onOpenTaskModal(item.id)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-[var(--fg3)]">
                      #{item.id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[var(--fg)] max-w-xs truncate">
                      {item.subject}
                    </td>
                    <td className="py-2.5 px-4">
                      {item.stage === 'ready_to_prod' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 uppercase">
                          <Rocket size={10} /> Ready to Prod
                        </span>
                      ) : item.stage === 'uat' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/40 uppercase">
                          <FlaskConical size={10} /> UAT / Testing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 uppercase">
                          <Code2 size={10} /> Developed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="py-2.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-2.5 px-4 text-xs text-[var(--fg3)] max-w-[140px] truncate">
                      {item.project}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-medium text-[var(--fg2)]">
                      {item.assignee || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono text-right text-[var(--fg3)]">
                      {formatRelativeTime(item.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info note */}
      <div className="p-3 bg-[var(--surface2)]/40 border-t border-[var(--border)] text-[11px] text-[var(--fg3)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>
            {activeTab === 'projects'
              ? `Menampilkan ${filteredProjects.length} proyek aktif dalam alur rilis.`
              : `Menampilkan ${filteredItems.length} tiket siap rilis atau dalam pengujian.`}
          </span>
        </div>
        <div className="hidden sm:block text-[10px] font-mono text-[var(--fg3)]">
          Klik baris mana saja untuk melihat detail lengkap work package.
        </div>
      </div>
    </div>
  );
}
