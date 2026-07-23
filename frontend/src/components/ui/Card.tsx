import React from 'react';
import { cn } from '../../utils/cn';

// ─ Card ──────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'coral';
}

const accentMap: Record<string, string> = {
  blue:   'border-l-4 border-l-brand-500',
  green:  'border-l-4 border-l-ok',
  amber:  'border-l-4 border-l-warn-DEFAULT',
  red:    'border-l-4 border-l-crit',
  violet: 'border-l-4 border-l-violet-DEFAULT',
  teal:   'border-l-4 border-l-teal-DEFAULT',
  coral:  'border-l-4 border-l-coral-DEFAULT',
};

export const Card: React.FC<CardProps> = ({ children, className, hover, accent, ...props }) => (
  <div
    className={cn(
      'bg-surface rounded-lg border border-border shadow-card',
      hover && 'transition-shadow duration-150 hover:shadow-card-hover cursor-pointer',
      accent && accentMap[accent],
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ─ CardHeader ────────────────────────────────────────────────────────────────
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className, ...props
}) => (
  <div
    className={cn('flex items-center justify-between px-5 py-3.5 border-b border-divider', className)}
    {...props}
  >
    {children}
  </div>
);

// ─ CardTitle ─────────────────────────────────────────────────────────────────
export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children, className, ...props
}) => (
  <h3 className={cn('text-sm font-semibold text-ink flex items-center gap-2', className)} {...props}>
    {children}
  </h3>
);

// ─ CardBody ──────────────────────────────────────────────────────────────────
export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children, className, ...props
}) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

// ─ StatCard — colorful KPI with colored accent bar ───────────────────────────
interface StatCardProps {
  label: string;
  value: string | number | React.ReactNode;
  sub?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'coral';
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
}

const valueColorMap: Record<string, string> = {
  blue:   'text-brand-700',
  green:  'text-ok-text',
  amber:  'text-warn-text',
  red:    'text-crit-text',
  violet: 'text-violet-text',
  teal:   'text-teal-text',
  coral:  'text-coral-text',
};

const bgColorMap: Record<string, string> = {
  blue:   'bg-brand-100',
  green:  'bg-ok-light',
  amber:  'bg-warn-light',
  red:    'bg-crit-light',
  violet: 'bg-violet-light',
  teal:   'bg-teal-light',
  coral:  'bg-coral-light',
};

export const StatCard: React.FC<StatCardProps> = ({
  label, value, sub, accent = 'blue', icon, trend, className,
}) => (
  <div className={cn(
    'bg-surface rounded-lg border border-border shadow-card p-5 flex flex-col gap-2',
    accentMap[accent],
    className
  )}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider leading-none">{label}</p>
      {icon && (
        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', bgColorMap[accent])}>
          <span className={valueColorMap[accent]}>{icon}</span>
        </div>
      )}
    </div>
    <p className={cn('text-3xl font-bold font-mono tabular-nums leading-none', valueColorMap[accent])}>
      {value}
    </p>
    {(sub || trend) && (
      <div className="flex items-center gap-2 min-w-0">
        {trend}
        {sub && <span className="text-xs text-ink-3 truncate">{sub}</span>}
      </div>
    )}
  </div>
);
