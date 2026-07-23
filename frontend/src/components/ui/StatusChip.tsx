import React from 'react';
import { cn } from '../../utils/cn';

interface StatusChipProps {
  status: boolean | string;
  label?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, className }) => {
  const isOk = status === true || status === 'healthy' || status === 'operational' || status === 'connected';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border',
      isOk
        ? 'text-ok-text bg-ok-light border-ok-mid'
        : 'text-crit-text bg-crit-light border-crit-mid',
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isOk ? 'bg-ok animate-pulse2' : 'bg-crit')} />
      {label ?? (isOk ? 'Healthy' : 'Degraded')}
    </span>
  );
};
