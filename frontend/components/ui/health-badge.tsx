import React from 'react';
import { cn } from '@/lib/utils';

interface HealthBadgeProps {
  health: 'good' | 'warning' | 'critical';
  label?: string;
  className?: string;
}

export function HealthBadge({ health, label, className }: HealthBadgeProps) {
  let displayLabel = label;
  let dotColor = 'bg-emerald-500';
  let badgeStyle =
    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';

  if (health === 'critical') {
    if (!label || label === 'Needs Attention') displayLabel = 'Kritis';
    dotColor = 'bg-rose-500';
    badgeStyle =
      'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50';
  } else if (health === 'warning') {
    if (!label || label === 'At Risk') displayLabel = 'Perhatian';
    dotColor = 'bg-amber-500';
    badgeStyle =
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
  } else {
    if (!label || label === 'On Track') displayLabel = 'Normal';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-tight select-none',
        badgeStyle,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
      {displayLabel}
    </span>
  );
}
