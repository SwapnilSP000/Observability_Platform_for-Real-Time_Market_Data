import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost' | 'violet' | 'secondary';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantCls: Record<Variant, string> = {
  primary:   'bg-gradient-blue text-white hover:opacity-90 shadow-sm',
  success:   'bg-gradient-green text-white hover:opacity-90 shadow-sm',
  danger:    'bg-gradient-red  text-white hover:opacity-90 shadow-sm',
  violet:    'bg-gradient-violet text-white hover:opacity-90 shadow-sm',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface-raised hover:border-brand-300',
  outline:   'bg-surface text-ink border border-border hover:bg-surface-raised hover:border-brand-300',
  ghost:     'text-ink-2 hover:bg-divider',
};
const sizeCls: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-xs gap-1',
  md: 'text-sm px-4 py-2   rounded-sm gap-1.5',
  lg: 'text-sm px-5 py-2.5 rounded-sm gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  children, className, variant = 'primary', size = 'md',
  isLoading = false, icon, disabled, ...props
}) => (
  <button
    className={cn(
      'inline-flex items-center justify-center font-semibold transition-all duration-150',
      'focus:outline-none focus-visible:shadow-ring',
      'disabled:opacity-50 disabled:cursor-not-allowed select-none',
      variantCls[variant], sizeCls[size], className
    )}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading
      ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      : icon}
    {children}
  </button>
);
