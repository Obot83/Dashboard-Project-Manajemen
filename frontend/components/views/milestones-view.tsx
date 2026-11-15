'use client';

import React from 'react';
import { Milestone, Layers, Calendar } from 'lucide-react';
import { MilestoneItem, VersionItem } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

interface MilestonesViewProps {
  milestones: MilestoneItem[];
  versions: VersionItem[];
}

export function MilestonesView({ milestones, versions }: MilestonesViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Milestones Card */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Milestone size={15} className="text-blue-600 dark:text-blue-400" />
          <span>Milestones Roadmap</span>
        </h3>

        <div className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-xs text-[var(--fg3)] py-8 text-center">
              Tidak ada milestone untuk scope project yang dipilih.
            </p>
          ) : (
            milestones.map((m) => (
              <div key={m.id} className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-[var(--fg)]">{m.subject}</span>
                  <StatusBadge status={m.status} />
                </div>
                <div className="text-[11px] text-[var(--fg3)] flex items-center justify-between">
                  <span>{m.project}</span>
                  <span className="font-mono flex items-center gap-1">
                    <Calendar size={11} /> Due: {formatDate(m.due_date)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sprints / Versions Card */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <h3 className="font-semibold text-xs text-[var(--fg)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>Sprint & Versi Rilis</span>
        </h3>

        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-xs text-[var(--fg3)] py-8 text-center">
              Tidak ada sprint atau versi rilis terdaftar.
            </p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-[var(--fg)]">{v.name}</div>
                  <div className="text-[11px] text-[var(--fg3)] mt-0.5">
                    {v.project} • Target: {formatDate(v.effective_date)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block">
                    {v.wp_count} items
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {v.closed_count} closed
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
