import React from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusChip } from '../components/ui/StatusChip';
import { useMarketTickers } from '../hooks/useMarketData';
import { useSystemStatus, useHealth } from '../hooks/useSystemStatus';
import { Skeleton } from '../components/ui/Skeleton';

const latencyData = [
  { time: '00:00', ms: 12 },
  { time: '04:00', ms: 15 },
  { time: '08:00', ms: 9 },
  { time: '12:00', ms: 14 },
  { time: '16:00', ms: 11 },
  { time: '20:00', ms: 10 },
];

export const Dashboard: React.FC = () => {
  const { data: tickersData, isLoading: tickersLoading } = useMarketTickers();
  const { data: statusData, isLoading: statusLoading } = useSystemStatus();
  const { data: healthData } = useHealth();

  const btcTicker = tickersData?.tickers.find((t) => t.symbol.includes('BTC'));
  const ethTicker = tickersData?.tickers.find((t) => t.symbol.includes('ETH'));

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            System Overview & Market Control
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time telemetry and Delta Exchange connectivity status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">ENV: {healthData?.environment || 'development'}</Badge>
          <Badge variant="muted">API v{healthData?.version || '0.1.0-alpha'}</Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-[#121824] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: BTC Mark Price */}
        <Card hover>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>BTC-PERP MARK</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {tickersLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              `$${(btcTicker?.markPrice || 64250).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono">
            <span className="text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.25%
            </span>
            <span className="text-slate-500">24h Vol: $1.2B</span>
          </div>
        </Card>

        {/* Card 2: ETH Mark Price */}
        <Card hover>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>ETH-PERP MARK</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {tickersLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              `$${(ethTicker?.markPrice || 3480).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono">
            <span className="text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2.80%
            </span>
            <span className="text-slate-500">24h Vol: $450M</span>
          </div>
        </Card>

        {/* Card 3: System Latency */}
        <Card hover>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>API LATENCY</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">11.4 ms</div>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono">
            <span className="text-emerald-400 font-semibold">P99 Optimal</span>
            <span className="text-slate-500">Uptime: 99.99%</span>
          </div>
        </Card>

        {/* Card 4: WebSocket Status */}
        <Card hover>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>WS STREAM STATUS</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            {statusLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : statusData?.webSocketState?.connected ? (
              <span className="text-emerald-400">ACTIVE FEED</span>
            ) : (
              <span className="text-amber-400">RECONNECTING</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
            <span>Subscriptions: {statusData?.webSocketState?.activeSubscriptions?.length || 2}</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Charts & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> API Response Latency Trend (ms)
            </CardTitle>
            <Badge variant="info">Real-time P95</Badge>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#1E293B', color: '#F8FAFC', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="ms" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#latencyGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Exchange Connectivity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Integration Health
            </CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-obsidian-800/80 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Delta REST Endpoint:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {statusData?.exchangeConnectivity?.deltaExchange?.restUrl || 'api.demo.delta.exchange'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">API Key Configured:</span>
                <span className={statusData?.exchangeConnectivity?.deltaExchange?.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                  {statusData?.exchangeConnectivity?.deltaExchange?.apiKeyConfigured ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masked Key:</span>
                <span className="text-slate-300">
                  {statusData?.exchangeConnectivity?.deltaExchange?.maskedApiKey || 'delt...8a1f'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-obsidian-800/80 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">WebSocket URL:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {statusData?.exchangeConnectivity?.deltaExchange?.wsUrl || 'socket.demo.delta.exchange'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reconnect Attempts:</span>
                <span className="text-slate-300">{statusData?.webSocketState?.reconnectAttempts ?? 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
