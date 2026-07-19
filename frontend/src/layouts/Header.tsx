import React from 'react';
import { Search, Bell, Shield, Cpu, RefreshCw } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { useSystemStatus } from '../hooks/useSystemStatus';

export const Header: React.FC = () => {
  const { data: statusData, isLoading, refetch } = useSystemStatus();

  const isHealthy = statusData?.status === 'operational' || statusData?.status === 'healthy';
  const deltaReachable = statusData?.exchangeConnectivity?.deltaExchange?.reachable ?? false;
  const wsConnected = statusData?.webSocketState?.connected ?? false;

  return (
    <header className="h-16 bg-obsidian-900/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search markets, orders, symbols (Press '/' to focus)..."
            className="w-full bg-obsidian-800/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Top Bar Right Status Widgets */}
      <div className="flex items-center gap-4">
        {/* System Health */}
        <StatusChip status={isHealthy} label={isHealthy ? 'System Healthy' : 'API Degraded'} />

        {/* Delta Exchange REST Reachability */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-obsidian-800/60 border border-slate-800 text-xs font-mono text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Delta REST:</span>
          <span className={deltaReachable ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {deltaReachable ? 'ONLINE' : 'UNREACHABLE'}
          </span>
        </div>

        {/* WebSocket Stream State */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-obsidian-800/60 border border-slate-800 text-xs font-mono text-slate-400">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>WS Feed:</span>
          <span className={wsConnected ? 'text-emerald-400' : 'text-amber-400'}>
            {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Notification Icon */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 font-mono">
            OP
          </div>
        </div>
      </div>
    </header>
  );
};
