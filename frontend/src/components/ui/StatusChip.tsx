import React from 'react';
import { cn } from '../../utils/cn';

interface StatusChipProps {
  status: 'healthy' | 'operational' | 'degraded' | 'down' | boolean;
  label?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, className }) => {
  const isGood = status === 'healthy' || status === 'operational' || status === true;
  const isDegraded = status === 'degraded';

  const dotColor = isGood
    ? 'bg-emerald-500 shadow-emerald-500/50'
    : isDegraded
    ? 'bg-amber-500 shadow-amber-500/50'
    : 'bg-rose-500 shadow-rose-500/50';

  const defaultText = isGood ? 'Operational' : isDegraded ? 'Degraded' : 'Offline';

  return (
    <div className={cn('inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-obsidian-800/80 border border-slate-800 text-xs font-mono text-slate-300', className)}>
      <span className={cn('w-2 h-2 rounded-full shadow-sm pulse-glow', dotColor)} />
      <span>{label || defaultText}</span>
    </div>
  );
};
