import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, LineChart, Briefcase, ListOrdered,
  BarChart3, Activity, FileText, GitCommit, Bell, Settings, User,
  HelpCircle, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

// Each nav item gets a distinct accent color
const menuGroups = [
  {
    title: 'Trading',
    items: [
      { path: '/',          label: 'Dashboard',     icon: LayoutDashboard, color: '#0073E6', bg: '#EBF4FF' },
      { path: '/markets',   label: 'Markets',        icon: TrendingUp,      color: '#0D8A4E', bg: '#E6F6EE' },
      { path: '/trading',   label: 'Terminal',       icon: LineChart,       color: '#6B2FF2', bg: '#F0EBFF' },
      { path: '/portfolio', label: 'Portfolio',      icon: Briefcase,       color: '#007B8A', bg: '#E0F5F7' },
      { path: '/orders',    label: 'Orders',         icon: ListOrdered,     color: '#C97500', bg: '#FFF7E6' },
    ],
  },
  {
    title: 'Observability',
    items: [
      { path: '/analytics',             label: 'Analytics', icon: BarChart3,  color: '#BC0070', bg: '#FFE5F4' },
      { path: '/observability/metrics', label: 'Metrics',   icon: Activity,   color: '#0073E6', bg: '#EBF4FF' },
      { path: '/observability/logs',    label: 'Logs',      icon: FileText,   color: '#3FAD00', bg: '#EEFAE5' },
      { path: '/observability/traces',  label: 'Traces',    icon: GitCommit,  color: '#E85D26', bg: '#FFF0EB' },
      { path: '/observability/alerts',  label: 'Alerts',    icon: Bell,       color: '#D93025', bg: '#FDECEA' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings, color: '#6B7E94', bg: '#F0F2F5' },
      { path: '/profile',  label: 'Profile',  icon: User,     color: '#6B7E94', bg: '#F0F2F5' },
      { path: '/help',     label: 'Help',     icon: HelpCircle, color: '#6B7E94', bg: '#F0F2F5' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  return (
    <aside className={cn(
      'flex flex-col h-full transition-all duration-200 z-30 select-none bg-ink border-r border-divider',
      collapsed ? 'w-[56px]' : 'w-[220px]'
    )}>
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-2.5 h-14 border-b border-white/10 shrink-0',
        collapsed ? 'justify-center' : 'px-4'
      )}>
        <div className="w-8 h-8 rounded-md bg-gradient-blue flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-none tracking-tight">DeltaOps</p>
            <p className="text-xs text-white/40 leading-none mt-0.5 font-mono">Observability v2</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {!collapsed && (
              <p className="px-4 pb-1 pt-2 text-xs font-semibold text-white/30 uppercase tracking-widest">
                {group.title}
              </p>
            )}
            {collapsed && <div className="mx-3 my-2 h-px bg-white/8" />}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'));
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md transition-all duration-100 text-xs font-medium',
                        collapsed ? 'justify-center p-2' : 'px-3 py-2',
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-white/55 hover:text-white/90 hover:bg-white/6'
                      )}
                      style={isActive ? { backgroundColor: item.color + '28' } : {}}
                    >
                      <span
                        className="flex items-center justify-center w-6 h-6 rounded shrink-0"
                        style={isActive ? { backgroundColor: item.bg, color: item.color } : { color: item.color + '99' }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-white/10 shrink-0 flex items-center',
        collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-blue flex items-center justify-center text-xs font-bold text-white shrink-0">
              DE
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-none">DevOps Engineer</p>
              <p className="text-xs text-brand-300 leading-none mt-0.5">SRE Operations</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
