import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-trade-blue hover:bg-blue-600 text-white focus:ring-blue-500 shadow-sm shadow-blue-500/20',
    secondary: 'bg-obsidian-700 hover:bg-obsidian-600 text-slate-200 border border-slate-700/60 focus:ring-slate-500',
    success: 'bg-trade-green hover:bg-emerald-600 text-white focus:ring-emerald-500 shadow-sm shadow-emerald-500/20',
    danger: 'bg-trade-red hover:bg-red-600 text-white focus:ring-red-500 shadow-sm shadow-red-500/20',
    outline: 'bg-transparent border border-slate-700 hover:bg-obsidian-800 text-slate-300 focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-obsidian-800 text-slate-400 hover:text-slate-200 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
