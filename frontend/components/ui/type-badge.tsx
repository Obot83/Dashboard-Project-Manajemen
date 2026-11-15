import React from 'react';
import { cn } from '@/lib/utils';
import { Bug, CheckSquare, Bookmark, Star, Milestone, FolderTree, FileText } from 'lucide-react';

interface TypeBadgeProps {
  type: string;
  className?: string;
  showIcon?: boolean;
}

export function TypeBadge({ type, className, showIcon = true }: TypeBadgeProps) {
  let icon = <CheckSquare size={11} className="text-blue-500 flex-shrink-0" />;

  const t = type ? type.trim() : '';

  switch (t) {
    case 'Bug':
      icon = <Bug size={11} className="text-rose-500 flex-shrink-0" />;
      break;
    case 'Task':
      icon = <CheckSquare size={11} className="text-blue-500 flex-shrink-0" />;
      break;
    case 'User story':
      icon = <Bookmark size={11} className="text-violet-500 flex-shrink-0" />;
      break;
    case 'Feature':
    case 'Epic':
      icon = <Star size={11} className="text-emerald-500 flex-shrink-0" />;
      break;
    case 'Milestone':
      icon = <Milestone size={11} className="text-amber-500 flex-shrink-0" />;
      break;
    case 'Summary task':
      icon = <FolderTree size={11} className="text-slate-500 flex-shrink-0" />;
      break;
    default:
      icon = <FileText size={11} className="text-slate-400 flex-shrink-0" />;
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[var(--border)] bg-[var(--surface2)] text-[var(--fg)] tracking-tight select-none whitespace-nowrap',
        className
      )}
    >
      {showIcon && icon}
      <span>{t || '—'}</span>
    </span>
  );
}
