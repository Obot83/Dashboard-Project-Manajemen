'use client';

import React from 'react';
import {
  Menu,
  RefreshCw,
  ChevronDown,
  Layers,
  CircleDot,
  Tv,
} from 'lucide-react';
import { ProjectOption } from '@/lib/types';
import { TabType } from './sidebar';

interface HeaderProps {
  activeTab: TabType;
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  projectOptions: ProjectOption[];
  onRefresh: () => void;
  isLoading: boolean;
  onOpenSidebar: () => void;
  lastUpdated: string;
}

const TAB_TITLES: Record<TabType, { section: string; title: string }> = {
  overview: { section: 'Operations', title: 'Executive Overview' },
  projects: { section: 'Operations', title: 'Projects Registry' },
  tasks: { section: 'Operations', title: 'Work Packages' },
  milestones: { section: 'Planning', title: 'Milestones & Roadmap' },
  workload: { section: 'Planning', title: 'Workload & Capacity' },
  reports: { section: 'Insights', title: 'Analytics & Reports' },
  users: { section: 'Administration', title: 'User Management' },
};

export function Header({
  activeTab,
  selectedProjectId,
  onSelectProject,
  projectOptions,
  onRefresh,
  isLoading,
  onOpenSidebar,
  lastUpdated,
}: HeaderProps) {
  const currentTabInfo = TAB_TITLES[activeTab] || { section: 'Dashboard', title: 'Overview' };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 gap-4 select-none">
      {/* Breadcrumbs / Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[var(--fg2)] hover:bg-[var(--surface-hover)]"
          aria-label="Buka Menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--fg3)] hidden sm:inline">{currentTabInfo.section}</span>
          <span className="text-[var(--fg3)] hidden sm:inline">/</span>
          <span className="font-semibold text-[var(--fg)] tracking-tight">{currentTabInfo.title}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Project / Workspace Selector */}
        <div className="relative flex items-center bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs">
          <span className="text-[var(--fg3)] mr-2 font-medium hidden md:inline">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-transparent font-medium text-[var(--fg)] outline-none cursor-pointer max-w-[140px] sm:max-w-[210px] truncate"
          >
            <option value="">Semua Project (Global)</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Database Status indicator (Subtle & Professional) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--fg3)] border border-[var(--border)] bg-[var(--surface2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Connected</span>
        </div>

        {/* TV Wallboard Mode Shortcut */}
        <a
          href="/tv"
          target="_blank"
          rel="noopener noreferrer"
          title="Buka Mode TV / Wallboard Monitoring Direksi"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm"
        >
          <Tv size={14} />
          <span>TV Mode</span>
        </a>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title={lastUpdated ? `Terakhir sinkron: ${lastUpdated}` : 'Segarkan Data'}
          className="p-1.5 text-[var(--fg2)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] rounded-lg border border-[var(--border)] transition-colors"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}
