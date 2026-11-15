import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  showIcon?: boolean;
}

export function PriorityBadge({ priority, className, showIcon = true }: PriorityBadgeProps) {
  let style =
    'bg-slate-100/70 text-slate-700 border-slate-200/70 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50';
  let icon = <Minus size={11} className="text-slate-400 flex-shrink-0" />;

  const p = priority ? priority.trim() : '';

  switch (p) {
    case 'Immediate':
      style =
        'bg-rose-50/70 text-rose-700 border-rose-200/70 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40 font-medium';
      icon = <AlertCircle size={11} className="text-rose-500 flex-shrink-0" />;
      break;
    case 'High':
      style =
        'bg-amber-50/70 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40 font-medium';
      icon = <ArrowUp size={11} className="text-amber-500 flex-shrink-0" />;
      break;
    case 'Normal':
      style =
        'bg-slate-100/70 text-slate-700 border-slate-200/70 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50';
      icon = <Minus size={11} className="text-slate-400 flex-shrink-0" />;
      break;
    case 'Low':
      style =
        'bg-slate-50 text-slate-500 border-slate-200/50 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800/40';
      icon = <ArrowDown size={11} className="text-slate-400 flex-shrink-0" />;
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-tight select-none whitespace-nowrap',
        style,
        className
      )}
    >
      {showIcon && icon}
      <span>{p || '—'}</span>
    </span>
  );
}
