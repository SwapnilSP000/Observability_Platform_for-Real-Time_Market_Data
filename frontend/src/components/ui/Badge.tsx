import React from 'react';
import { cn } from '../../utils/cn';

type Variant =
  | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'coral' | 'gray' | 'fuchsia' | 'sky'
  // Legacy aliases kept for backward compat
  | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'muted' | 'secondary';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: string;
  dot?: boolean;
  pulse?: boolean;
}

const BASE: Record<string, { wrap: string; dot: string }> = {
  blue:    { wrap: 'text-brand-700  bg-brand-100  border-brand-300',        dot: 'bg-brand-600' },
  green:   { wrap: 'text-ok-text    bg-ok-light   border-ok-mid',           dot: 'bg-ok' },
  amber:   { wrap: 'text-warn-text  bg-warn-light  border-warn-mid',        dot: 'bg-warn-DEFAULT' },
  red:     { wrap: 'text-crit-text  bg-crit-light  border-crit-mid',        dot: 'bg-crit' },
  violet:  { wrap: 'text-violet-text bg-violet-light border-violet-mid',    dot: 'bg-violet-DEFAULT' },
  teal:    { wrap: 'text-teal-text   bg-teal-light   border-teal-mid',      dot: 'bg-teal-DEFAULT' },
  coral:   { wrap: 'text-coral-text  bg-coral-light  border-coral-mid',     dot: 'bg-coral-DEFAULT' },
  gray:    { wrap: 'text-ink-2 bg-surface-raised border-divider',           dot: 'bg-ink-3' },
  fuchsia: { wrap: 'text-fuchsia-text bg-fuchsia-light border-fuchsia-mid', dot: 'bg-fuchsia-DEFAULT' },
  sky:     { wrap: 'text-sky-text bg-sky-light border-sky-mid',             dot: 'bg-sky-DEFAULT' },
};
// Legacy aliases
const ALIAS: Record<string, string> = {
  success: 'green', danger: 'red', warning: 'amber', info: 'blue',
  purple: 'violet', muted: 'gray', secondary: 'gray',
};
const styles: Record<string, { wrap: string; dot: string }> = new Proxy(BASE, {
  get(target, key: string) {
    return target[ALIAS[key] ?? key] ?? target.gray;
  },
});

export const Badge: React.FC<BadgeProps> = ({
  children, className, variant = 'blue', dot = false, pulse = false, ...props
}) => {
  const s = styles[variant] ?? styles.gray;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border',
        s.wrap, className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          s.dot,
          pulse && 'animate-pulse2'
        )} />
      )}
      {children}
    </span>
  );
};
