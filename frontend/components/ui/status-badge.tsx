import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let dotColor = 'bg-slate-400';
  let badgeStyle =
    'bg-slate-100/70 text-slate-700 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/60';

  const s = status ? status.trim() : '';

  switch (s) {
    case 'New':
    case 'Confirmed':
      dotColor = 'bg-blue-500';
      badgeStyle =
        'bg-blue-50/70 text-blue-700 border-blue-200/70 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40';
      break;
    case 'In progress':
    case 'In testing':
      dotColor = 'bg-sky-500';
      badgeStyle =
        'bg-sky-50/70 text-sky-700 border-sky-200/70 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40';
      break;
    case 'Developed':
    case 'Done':
    case 'Ready To Production':
      dotColor = 'bg-emerald-500';
      badgeStyle =
        'bg-emerald-50/70 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40';
      break;
    case 'Tested':
      dotColor = 'bg-amber-500';
      badgeStyle =
        'bg-amber-50/70 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40';
      break;
    case 'On hold':
      dotColor = 'bg-orange-500';
      badgeStyle =
        'bg-orange-50/70 text-orange-700 border-orange-200/70 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40';
      break;
    case 'Rejected':
    case 'Test failed':
      dotColor = 'bg-rose-500';
      badgeStyle =
        'bg-rose-50/70 text-rose-700 border-rose-200/70 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40';
      break;
    case 'Closed':
      dotColor = 'bg-slate-400';
      badgeStyle =
        'bg-slate-100/70 text-slate-600 border-slate-200/70 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-tight select-none whitespace-nowrap',
        badgeStyle,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
      {s || '—'}
    </span>
  );
}
