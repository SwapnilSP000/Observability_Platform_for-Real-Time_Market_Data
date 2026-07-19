import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Briefcase,
  ListOrdered,
  Layers,
  BarChart3,
  Activity,
  FileText,
  GitCommit,
  Bell,
  Settings,
  User,
  HelpCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const menuGroups = [
    {
      title: 'TRADING & MARKETS',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/markets', label: 'Markets', icon: TrendingUp },
        { path: '/trading', label: 'Trading Terminal', icon: LineChart },
        { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
        { path: '/orders', label: 'Orders', icon: ListOrdered },
        { path: '/positions', label: 'Positions', icon: Layers },
      ],
    },
    {
      title: 'ANALYTICS & OBSERVABILITY',
      items: [
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/observability/metrics', label: 'Metrics', icon: Activity },
        { path: '/observability/logs', label: 'Logs', icon: FileText },
        { path: '/observability/traces', label: 'Traces', icon: GitCommit },
        { path: '/observability/alerts', label: 'Alerts', icon: Bell },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/help', label: 'Help & Docs', icon: HelpCircle },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'relative bg-obsidian-900 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-30 select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-sm text-slate-100 tracking-tight flex items-center gap-1.5">
                  DeltaOps <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-mono">Enterprise v0.1.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Group Items */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold text-slate-500 tracking-wider mb-2 font-mono">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150',
                          isActive
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <div className="text-[11px] text-slate-500 font-mono">
            <span>Delta Exchange</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
