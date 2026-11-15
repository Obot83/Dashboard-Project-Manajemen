'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Tv,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Rocket,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  FolderGit2,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  KPIResponse,
  ReleasePipelineResponse,
  MonthlyVolumeItem,
  StatusDistributionItem,
  ProjectItem,
} from '@/lib/types';
import { HealthBadge } from '@/components/ui/health-badge';
import { StatusBadge } from '@/components/ui/status-badge';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatMonth(m: string): string {
  const parts = m.split('-');
  if (parts.length === 2) {
    const idx = parseInt(parts[1], 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${MONTH_NAMES[idx]} '${parts[0].slice(2)}`;
    }
  }
  return m;
}

export default function TVDashboardPage() {
  const [kpi, setKpi] = useState<KPIResponse | null>(null);
  const [pipeline, setPipeline] = useState<ReleasePipelineResponse | null>(null);
  const [monthlyVol, setMonthlyVol] = useState<MonthlyVolumeItem[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistributionItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Enforce Clean Light Mode (Dark mode completely removed)
  useEffect(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Data Function
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [k, p, m, s, proj] = await Promise.all([
        api.getKPI(),
        api.getReleasePipeline(),
        api.getMonthlyVolume(),
        api.getStatusDistribution(),
        api.getProjects(),
      ]);
      setKpi(k);
      setPipeline(p);
      setMonthlyVol(m);
      setStatusDist(s);
      setProjects(proj);
      setLastSync(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCountdown(60);
    } catch (err) {
      console.error('TV Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-Refresh every 60s
  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const totalStatus = statusDist.reduce((a, b) => a + b.count, 0) || 1;
  const maxVol = Math.max(
    ...monthlyVol.flatMap((v) => [v.created || v.count || 0, v.resolved || 0]),
    1
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col p-4 sm:p-6 lg:p-8 select-none transition-colors duration-200">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[var(--border)] gap-4">
        {/* Title & Organization */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md flex-shrink-0">
            <Tv size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider text-blue-700 dark:text-blue-300 uppercase font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/40">
                DIRECTORATE COMMAND CENTER
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-200/80 dark:border-emerald-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)] mt-1">
              Executive Project & Release Monitoring
            </h1>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-4 sm:gap-6 self-end md:self-auto">
          {/* Digital Clock */}
          <div className="text-right">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-xs text-[var(--fg3)] font-medium">
              {currentDate || 'Memuat waktu...'}
            </div>
          </div>

          {/* Refresh Countdown & Buttons */}
          <div className="flex items-center gap-2 pl-4 border-l border-[var(--border)]">
            <div className="hidden sm:flex flex-col items-end text-[11px] font-mono text-[var(--fg3)]">
              <span>Auto-refresh:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{countdown}s</span>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Refresh sekarang"
              className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--fg2)] transition-colors shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''} />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Layar Penuh (F11)'}
              className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--fg2)] transition-colors shadow-sm"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <Link
              href="/"
              title="Kembali ke Dashboard Interaktif"
              className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--fg2)] transition-colors shadow-sm"
            >
              <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Key Metrics Strip (Hero KPI Row) ───────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 my-5">
        {/* Active Projects */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Active Projects
          </div>
          <div className="text-3xl font-extrabold font-mono text-[var(--fg)] mt-1.5">
            {kpi?.projects ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">proyek aktif berjalan</div>
        </div>

        {/* Work Packages */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--fg3)] uppercase tracking-wider">
            Work Packages
          </div>
          <div className="text-3xl font-extrabold font-mono text-[var(--fg)] mt-1.5">
            {kpi?.work_packages ?? '—'}
          </div>
          <div className="text-[11px] text-[var(--fg3)] mt-1">total item tercatat</div>
        </div>

        {/* Closed */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Closed Items
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {kpi?.closed ?? '—'}
          </div>
          <div className="text-[11px] text-emerald-600/80 font-mono mt-1 font-semibold">
            {kpi?.close_rate ?? 0}% close rate
          </div>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-rose-200 dark:border-rose-900/50 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Overdue
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1.5">
            {kpi?.overdue ?? '—'}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">perlu akselerasi</div>
        </div>

        {/* Ready to Production */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Rocket size={13} className="text-emerald-600 dark:text-emerald-400" /> Ready to Prod
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-1.5">
            {pipeline?.summary.ready_to_prod_total ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium">siap rilis produksi</div>
        </div>

        {/* In UAT & Testing */}
        <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 shadow-sm">
          <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <FlaskConical size={13} className="text-sky-600 dark:text-sky-400" /> In UAT & Testing
          </div>
          <div className="text-3xl font-extrabold font-mono text-sky-700 dark:text-sky-300 mt-1.5">
            {pipeline?.summary.uat_total ?? 0}
          </div>
          <div className="text-[11px] text-sky-700/80 dark:text-sky-400/80 mt-1 font-medium">dalam uji klien/QA</div>
        </div>
      </section>

      {/* ── Main Operations Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Stage (Col 7): Release Pipeline & Throughput */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Card: Release Pipeline Matrix */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)] flex items-center gap-2">
                  <Rocket size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Kesiapan Rilis Proyek (Ready to Prod & UAT)
                </h3>
                <p className="text-[11px] text-[var(--fg3)] mt-0.5">
                  Proyek aktif dengan pekerjaan yang telah siap rilis atau dalam tahap pengujian pengguna.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[var(--fg3)] bg-[var(--surface2)] px-2.5 py-0.5 rounded border border-[var(--border)]">
                {pipeline?.projects.length ?? 0} Proyek
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--fg3)] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Project</th>
                    <th className="py-2.5 px-3 text-center">Ready to Prod</th>
                    <th className="py-2.5 px-3 text-center">In UAT / Testing</th>
                    <th className="py-2.5 px-3 text-center">Developed</th>
                    <th className="py-2.5 px-3">Komposisi Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pipeline?.projects.slice(0, 6).map((p) => {
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
                      <tr key={p.project_id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[var(--fg)]">
                          {p.project_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {p.ready_to_prod_count > 0 ? (
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/40">
                              {p.ready_to_prod_count}
                            </span>
                          ) : (
                            <span className="text-[var(--fg3)]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {p.uat_count > 0 ? (
                            <span className="font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200/80 dark:border-sky-800/40">
                              {p.uat_count}
                            </span>
                          ) : (
                            <span className="text-[var(--fg3)]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {p.developed_count > 0 ? (
                            <span className="font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/40">
                              {p.developed_count}
                            </span>
                          ) : (
                            <span className="text-[var(--fg3)]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="w-28">
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                              {readyPct > 0 && (
                                <div style={{ width: `${readyPct}%` }} className="h-full bg-emerald-500" />
                              )}
                              {uatPct > 0 && (
                                <div style={{ width: `${uatPct}%` }} className="h-full bg-sky-500" />
                              )}
                              {devPct > 0 && (
                                <div style={{ width: `${devPct}%` }} className="h-full bg-amber-500" />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Monthly Throughput (Created vs Resolved) */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)]">
                  Laju Throughput (Created vs Resolved)
                </h3>
                <p className="text-[11px] text-[var(--fg3)] mt-0.5">
                  Perbandingan tiket masuk vs tiket terselesaikan (12 bulan terakhir)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[var(--fg2)]">
                  <span className="w-2 h-2 rounded bg-blue-600 dark:bg-blue-500" /> Dibuat
                </span>
                <span className="flex items-center gap-1.5 text-[var(--fg2)]">
                  <span className="w-2 h-2 rounded bg-emerald-500" /> Selesai
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-4 pt-4 pb-1 min-h-[150px]">
              {monthlyVol.map((m) => {
                const cVal = m.created ?? m.count ?? 0;
                const rVal = m.resolved ?? 0;
                const cHeight = Math.max(Math.round((cVal / maxVol) * 100), cVal > 0 ? 8 : 0);
                const rHeight = Math.max(Math.round((rVal / maxVol) * 100), rVal > 0 ? 8 : 0);

                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center">
                    <div className="text-[10px] font-mono text-[var(--fg3)] mb-1">
                      {cVal}/{rVal}
                    </div>
                    <div className="w-full max-w-[50px] h-28 flex items-end justify-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-t p-1">
                      <div className="flex-1 h-full flex flex-col justify-end">
                        <div
                          style={{ height: `${cHeight}%` }}
                          className="w-full bg-blue-600 dark:bg-blue-500 rounded-t"
                          title={`Dibuat: ${cVal}`}
                        />
                      </div>
                      <div className="flex-1 h-full flex flex-col justify-end">
                        <div
                          style={{ height: `${rHeight}%` }}
                          className="w-full bg-emerald-500 rounded-t"
                          title={`Selesai: ${rVal}`}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--fg3)] mt-2 font-medium">
                      {formatMonth(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Stage (Col 5): Project Health Radar & Status Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card: Project Health Radar */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)] flex items-center gap-2">
                  <FolderGit2 size={14} className="text-blue-600 dark:text-blue-400" />
                  Status Kesehatan Proyek Klien
                </h3>
                <p className="text-[11px] text-[var(--fg3)] mt-0.5">
                  Pemantauan performa delivery & risiko keterlambatan proyek utama.
                </p>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {projects.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[var(--fg)] truncate">{p.name}</div>
                    <div className="text-[11px] text-[var(--fg3)] font-mono mt-0.5">
                      {p.closed_count}/{p.wp_count} task • {p.overdue_count} overdue
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-16">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(p.close_rate, 100)}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <div className="text-[10px] text-right font-mono text-[var(--fg3)] mt-0.5">
                        {p.close_rate}%
                      </div>
                    </div>
                    <HealthBadge health={p.health} label={p.health_label} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Distribusi Status Operasional */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)] mb-3">
              Distribusi Status Tiket Operasional
            </h3>
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {statusDist.slice(0, 6).map((item) => {
                const pct = Math.round((item.count / totalStatus) * 100);
                return (
                  <div key={item.status} className="flex items-center gap-3 text-xs">
                    <div className="min-w-[110px]">
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 dark:bg-slate-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono font-medium text-[var(--fg)] min-w-[50px] text-right">
                      {item.count} <span className="text-[10px] text-[var(--fg3)]">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Status Bar ─────────────────────────────────────────── */}
      <footer className="mt-5 pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--fg3)] gap-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Server Engine: Golang API • OpenProject PostgreSQL (103.196.155.36)</span>
        </div>
        <div>
          Sinkronisasi Terakhir: <span className="text-[var(--fg)] font-semibold">{lastSync || '—'}</span> (Pembaruan Otomatis Setiap 60 Detik)
        </div>
      </footer>
    </div>
  );
}
