import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'block';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'line', ...props }) => (
  <div
    className={cn(
      'animate-pulse bg-divider',
      variant === 'circle' ? 'rounded-full' : 'rounded-sm',
      variant === 'block' ? 'w-full h-32' : 'h-4',
      className
    )}
    {...props}
  />
);
