'use client';

import React from 'react';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Users2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Activity,
} from 'lucide-react';
import { KPIResponse, StatusDistributionItem, TypeDistributionItem, MonthlyVolumeItem, WorkPackageItem, ReleasePipelineResponse } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { formatRelativeTime } from '@/lib/utils';
import { ReleasePipelineCard } from './release-pipeline-card';

interface OverviewViewProps {
  kpi: KPIResponse | null;
  statusDist: StatusDistributionItem[];
  typeDist: TypeDistributionItem[];
  monthlyVol: MonthlyVolumeItem[];
  recentWp: WorkPackageItem[];
  releasePipeline: ReleasePipelineResponse | null;
  onOpenTaskModal: (id: number) => void;
  onNavigateToOverdue: () => void;
  onNavigateToTasks: () => void;
  onSelectProject?: (id: number) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatMonth(m: string, full = false): string {
  const parts = m.split('-');
  if (parts.length === 2) {
    const idx = parseInt(parts[1], 10) - 1;
    if (idx >= 0 && idx < 12) {
      return full ? `${MONTH_FULL[idx]} ${parts[0]}` : `${MONTH_NAMES[idx]} '${parts[0].slice(2)}`;
    }
  }
  return m;
}

export function OverviewView({
  kpi,
  statusDist,
  typeDist,
  monthlyVol,
  recentWp,
  releasePipeline,
  onOpenTaskModal,
  onNavigateToOverdue,
  onNavigateToTasks,
  onSelectProject,
}: OverviewViewProps) {
  const totalStatusCount = statusDist.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const maxTypeCount = Math.max(...typeDist.map((v) => v.count), 1);

  const totalCreated = monthlyVol.reduce((acc, curr) => acc + (curr.created || curr.count || 0), 0);
  const totalResolved = monthlyVol.reduce((acc, curr) => acc + (curr.resolved || 0), 0);
  const maxVolume = Math.max(
    ...monthlyVol.flatMap((v) => [v.created || v.count || 0, v.resolved || 0]),
    1
  );

  return (
    <div className="space-y-6">
      {/* KPI Metrik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Projects */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Active Projects
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[var(--fg)] mt-1.5">
            {kpi?.projects ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">proyek aktif</div>
        </div>

        {/* Work Packages */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Work Packages
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[var(--fg)] mt-1.5">
            {kpi?.work_packages ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">total item</div>
        </div>

        {/* Closed Items */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Closed
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
            {kpi?.closed ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">
            {kpi?.close_rate ?? 0}% close rate
          </div>
        </div>

        {/* Overdue Items (Clickable) */}
        <div
          onClick={onNavigateToOverdue}
          className="p-4 rounded-xl bg-[var(--surface)] border border-rose-200 dark:border-rose-900/60 shadow-sm cursor-pointer hover:border-rose-400 dark:hover:border-rose-700 transition-colors group"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <span>Overdue</span>
            <span className="text-[10px] font-mono group-hover:underline">VIEW →</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 mt-1.5">
            {kpi?.overdue ?? '—'}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1">melewati target due date</div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-sky-600 dark:text-sky-400 mt-1.5">
            {kpi?.in_progress ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">dalam pengerjaan</div>
        </div>

        {/* Team Members */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Team Members
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[var(--fg)] mt-1.5">
            {kpi?.users ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">personel aktif</div>
        </div>
      </div>

      {/* Monthly Trend & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Throughput & Volume */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider">
                Throughput & Volume Work Package
              </h3>
              <p className="text-xs text-[var(--fg3)] mt-0.5">
                Perbandingan tiket dibuat vs selesai (12 bulan terakhir)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-500 inline-block" />
                <span className="text-[var(--fg2)]">Dibuat:</span>
                <span className="font-mono font-bold text-[var(--fg)]">{totalCreated}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400 inline-block" />
                <span className="text-[var(--fg2)]">Selesai:</span>
                <span className="font-mono font-bold text-[var(--fg)]">{totalResolved}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 pt-6 pb-2 min-h-[160px]">
            {monthlyVol.map((m) => {
              const createdVal = m.created ?? m.count ?? 0;
              const resolvedVal = m.resolved ?? 0;
              const createdHeight = Math.max(
                Math.round((createdVal / maxVolume) * 100),
                createdVal > 0 ? 6 : 0
              );
              const resolvedHeight = Math.max(
                Math.round((resolvedVal / maxVolume) * 100),
                resolvedVal > 0 ? 6 : 0
              );
              const resolveRate =
                createdVal > 0 ? Math.round((resolvedVal / createdVal) * 100) : 0;

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip on Hover */}
                  <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col gap-1 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 whitespace-nowrap min-w-[130px]">
                    <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-0.5">
                      {formatMonth(m.month, true)}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />
                        Dibuat
                      </span>
                      <span className="font-mono font-bold text-white">{createdVal}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
                        Selesai
                      </span>
                      <span className="font-mono font-bold text-white">{resolvedVal}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-700/40 flex justify-between">
                      <span>Rasio Selesai:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{resolveRate}%</span>
                    </div>
                  </div>

                  {/* Dual Bars Side by Side */}
                  <div className="w-full max-w-[64px] h-32 flex items-end justify-center gap-1.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-t p-1">
                    {/* Created Bar */}
                    <div className="flex-1 h-full flex flex-col justify-end items-center">
                      <div
                        style={{ height: `${createdHeight}%` }}
                        className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-500"
                        title={`Dibuat: ${createdVal}`}
                      />
                    </div>
                    {/* Resolved Bar */}
                    <div className="flex-1 h-full flex flex-col justify-end items-center">
                      <div
                        style={{ height: `${resolvedHeight}%` }}
                        className="w-full bg-emerald-500 dark:bg-emerald-400 rounded-t transition-all duration-300 group-hover:bg-emerald-400"
                        title={`Selesai: ${resolvedVal}`}
                      />
                    </div>
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] text-[var(--fg2)] font-mono mt-2 font-medium">
                    {formatMonth(m.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col">
          <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-1">
            Distribusi Status
          </h3>
          <p className="text-xs text-[var(--fg3)] mb-4">Total breakdown status item aktif</p>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {statusDist.map((item) => {
              const pct = Math.round((item.count / totalStatusCount) * 100);
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="min-w-[105px]">
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 dark:bg-slate-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-medium text-[var(--fg2)] min-w-[50px] text-right">
                    {item.count} <span className="text-[10px] text-[var(--fg3)]">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Release & Deployment Readiness (Ready to Production & UAT) */}
      <ReleasePipelineCard
        data={releasePipeline}
        onOpenTaskModal={onOpenTaskModal}
        onSelectProject={onSelectProject}
      />

      {/* Type Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Type */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-4">
            Distribusi Tipe Pekerjaan
          </h3>
          <div className="space-y-3">
            {typeDist.map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <div className="min-w-[95px]">
                  <TypeBadge type={t.type} />
                </div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                    style={{ width: `${(t.count / maxTypeCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-medium text-[var(--fg)] min-w-[35px] text-right">
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work Package Activity */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider">
              Aktivitas Terakhir
            </h3>
            <button
              onClick={onNavigateToTasks}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Semua Task <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
            {recentWp.map((wp) => (
              <div
                key={wp.id}
                onClick={() => onOpenTaskModal(wp.id)}
                className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[var(--fg3)] font-semibold">#{wp.id}</span>
                    <span className="font-semibold text-[var(--fg)] truncate">{wp.subject}</span>
                  </div>
                  <div className="text-[11px] text-[var(--fg3)] mt-0.5 truncate">
                    {wp.project} • {formatRelativeTime(wp.updated_at)}
                  </div>
                </div>
                <StatusBadge status={wp.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
