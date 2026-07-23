import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  /** Legacy alias for badge */
  count?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className }) => (
  <div className={cn('flex gap-0 border-b border-divider', className)}>
    {tabs.map((tab) => {
      const active = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-all duration-150',
            'border-b-2 -mb-px',
            active
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-ink-2 hover:text-ink hover:border-border font-semibold'
          )}
        >
          {tab.icon}
          {tab.label}
          {(tab.badge ?? tab.count) !== undefined && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-xs font-bold',
              active ? 'bg-brand-100 text-brand-700' : 'bg-divider text-ink-3'
            )}>
              {tab.badge ?? tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
