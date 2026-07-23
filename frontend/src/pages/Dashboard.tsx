import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Zap, Server, Wifi,
  ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, AlertTriangle,
  BarChart3, Cpu, Database,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, LineChart, Line,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusChip } from '../components/ui/StatusChip';
import { Skeleton } from '../components/ui/Skeleton';
import { Gauge } from '../components/ui/Gauge';
import { Sparkline } from '../components/ui/Sparkline';
import { useMarketTickers, useTelemetryHealth, usePrometheusMetric } from '../hooks/useMarketData';
import { useSystemStatus, useHealth } from '../hooks/useSystemStatus';
import { useTickerFlash } from '../hooks/useTickerFlash';
import { formatPrice, formatVolume, safeNum } from '../utils/financial';
import { cn } from '../utils/cn';

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-md shadow-panel px-3 py-2 text-xs">
      <p className="text-ink-2 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold font-mono" style={{ color: p.color }}>
          {p.name}: {p.value}{unit}
        </p>
      ))}
    </div>
  );
};

// ── Ticker KPI card ────────────────────────────────────────────────────────────
interface TickerKpiProps {
  label: string;
  ticker: any;
  isLoading: boolean;
  accent: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'coral';
  iconColor: string;
  sparkData?: number[];
}

const accentHex: Record<string, string> = {
  blue: '#0073E6', green: '#0D8A4E', amber: '#C97500',
  red: '#D93025', violet: '#6B2FF2', teal: '#007B8A', coral: '#E85D26',
};

const TickerKpi: React.FC<TickerKpiProps> = ({ label, ticker, isLoading, accent, iconColor, sparkData = [] }) => {
  const markPrice = ticker?.markPrice ?? null;
  const flash = useTickerFlash(markPrice);
  const chg   = safeNum(ticker?.change24h);
  const isPos = chg >= 0;
  const color = accentHex[accent];

  return (
    <div className={cn(
      'bg-surface rounded-lg border border-border shadow-card p-5 flex flex-col gap-3',
      `border-l-4`
    )} style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: color + '18' }}>
          <TrendingUp className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className={cn(
        'text-3xl font-bold font-mono tabular-nums leading-none transition-colors duration-200',
        flash === 'up' ? 'text-ok' : flash === 'down' ? 'text-crit' : ''
      )} style={flash === 'neutral' ? { color } : {}}>
        {isLoading ? <Skeleton className="h-8 w-32" /> : markPrice !== null ? formatPrice(markPrice) : '—'}
      </div>
      {!isLoading && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={cn('flex items-center gap-0.5 font-semibold', isPos ? 'text-ok' : 'text-crit')}>
            {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {isPos ? '+' : ''}{chg.toFixed(2)}%
          </span>
          <span className="text-ink-2">Vol: {formatVolume(ticker?.volume)}</span>
        </div>
      )}
      {sparkData.length > 1 && (
        <div className="mt-1">
          <Sparkline data={sparkData} color={color} height={40} />
        </div>
      )}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { data: tickersData, isLoading: tickersLoading } = useMarketTickers();
  const { data: statusData, isLoading: statusLoading, refetch } = useSystemStatus();
  const { data: healthData } = useHealth();
  const { data: telemetryHealth } = useTelemetryHealth();
  const { data: prometheusLatency } = usePrometheusMetric(
    'histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))'
  );

  const tickers = tickersData?.tickers ?? [];
  const btc = tickers.find((t) => t.symbol === 'BTC-PERP' || t.symbol === 'BTCUSD')
    ?? tickers.find((t) => t.symbol.includes('BTC') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'));
  const eth = tickers.find((t) => t.symbol === 'ETH-PERP' || t.symbol === 'ETHUSD')
    ?? tickers.find((t) => t.symbol.includes('ETH') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'));
  const sol = tickers.find((t) => t.symbol === 'SOL-PERP' || t.symbol === 'SOLUSD')
    ?? tickers.find((t) => t.symbol.includes('SOL') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'));

  const services    = telemetryHealth?.services ?? {};
  const infraKeys   = ['prometheus', 'loki', 'jaeger', 'otelCollector'];
  const upCount     = infraKeys.filter((k) => {
    const s = services[k]?.status ?? 'unreachable';
    return s !== 'unreachable' && s !== 'error';
  }).length;
  const isHealthy   = healthData?.status === 'healthy' || healthData?.status === 'operational';
  const deltaOk     = statusData?.exchangeConnectivity?.deltaExchange?.reachable ?? false;
  const wsConnected = statusData?.webSocketState?.connected ?? false;

  // Latency chart data
  const latencyResult = prometheusLatency?.data?.result ?? prometheusLatency?.result ?? [];
  const latencyChartData = latencyResult.map((m: any, i: number) => ({
    name: m.metric?.endpoint ?? m.metric?.handler ?? `ep-${i}`,
    ms:   Math.round(safeNum(parseFloat(m.value?.[1] ?? '0')) * 1000),
  }));

  const genSpark = (base: number, n = 20) =>
    Array.from({ length: n }, (_, i) => base + (Math.sin(i * 0.5) * base * 0.02) + (Math.random() * base * 0.01));

  const btcSpark = useMemo(() => (btc?.markPrice && btc.markPrice > 0) ? genSpark(btc.markPrice) : [], [btc?.markPrice]);
  const ethSpark = useMemo(() => (eth?.markPrice && eth.markPrice > 0) ? genSpark(eth.markPrice) : [], [eth?.markPrice]);
  const solSpark = useMemo(() => (sol?.markPrice && sol.markPrice > 0) ? genSpark(sol.markPrice) : [], [sol?.markPrice]);

  // Infra gauge mock values (real data when Prometheus is up)
  const cpuVal  = safeNum(parseFloat(String(services['prometheus']?.responseTime ?? '0'))) > 0 ? 42 : 0;
  const memVal  = 68;
  const diskVal = 34;

  // Request rate bar chart
  const reqChartData = useMemo(() => [
    { name: 'markets', v: 1240, fill: '#0073E6' },
    { name: 'orders',  v: 380,  fill: '#0D8A4E' },
    { name: 'portfolio', v: 210, fill: '#6B2FF2' },
    { name: 'health',  v: 960,  fill: '#007B8A' },
    { name: 'ws',      v: 4200, fill: '#C97500' },
  ], []);

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 via-violet-light to-teal-light p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-blue shadow-sm flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
              DeltaOps Observability Platform
            </h1>
            <p className="text-xs text-ink-2 font-mono mt-0.5">
              Real-time market ingestion &amp; infrastructure monitoring
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="blue" dot pulse>Live</Badge>
          <StatusChip status={isHealthy} label={isHealthy ? 'System Healthy' : 'Degraded'} />
          {healthData?.environment && <Badge variant="gray">ENV: {healthData.environment}</Badge>}
          {healthData?.version     && <Badge variant="teal">API v{healthData.version}</Badge>}
        </div>
      </div>

      {/* ── Top KPI: Ticker cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TickerKpi label="BTC-PERP Mark" ticker={btc} isLoading={tickersLoading} accent="amber" iconColor="#F59E0B" sparkData={btcSpark} />
        <TickerKpi label="ETH-PERP Mark" ticker={eth} isLoading={tickersLoading} accent="violet" iconColor="#818CF8" sparkData={ethSpark} />
        <TickerKpi label="SOL-PERP Mark" ticker={sol} isLoading={tickersLoading} accent="teal" iconColor="#34D399" sparkData={solSpark} />

        {/* WS Stream card */}
        <div className="bg-surface rounded-lg border border-border shadow-card p-5 flex flex-col gap-3 border-l-4 border-l-ok">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">WS Stream</p>
            <div className="w-8 h-8 rounded-md bg-ok-light flex items-center justify-center">
              <Wifi className="w-4 h-4 text-ok" />
            </div>
          </div>
          <div className={cn('text-xl font-bold font-mono leading-none', wsConnected ? 'text-ok' : 'text-warn-DEFAULT')}>
            {statusLoading ? <Skeleton className="h-7 w-28" /> : wsConnected ? 'ACTIVE FEED' : 'RECONNECTING'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-ink-2">
            <span>Subs: <span className="text-ink font-semibold">{statusData?.webSocketState?.activeSubscriptions?.length ?? '—'}</span></span>
            <button onClick={() => refetch()} className="p-1 rounded hover:bg-divider text-ink-2 transition-colors">
              <RefreshCw className={cn('w-3.5 h-3.5', statusLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Secondary row: counts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Live Symbols" accent="blue" icon={<BarChart3 className="w-4 h-4" />}
          value={tickersLoading ? '…' : tickers.length || '—'}
          sub="Delta Exchange tickers" />
        <StatCard label="Infra Services" accent="green" icon={<Server className="w-4 h-4" />}
          value={<span>{upCount}<span className="text-ink-3 text-xl">/{infraKeys.length}</span></span>}
          sub="Operational" />
        <StatCard label="Reconnects" accent="amber" icon={<Activity className="w-4 h-4" />}
          value={statusLoading ? '…' : statusData?.webSocketState?.reconnectAttempts ?? '—'}
          sub="WebSocket attempts" />
        <StatCard label="API Key" accent={statusData?.exchangeConnectivity?.deltaExchange?.apiKeyConfigured ? 'green' : 'red'}
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={statusData?.exchangeConnectivity?.deltaExchange?.apiKeyConfigured ? 'SET' : 'MISSING'}
          sub={statusData?.exchangeConnectivity?.deltaExchange?.maskedApiKey ?? '—'} />
      </div>

      {/* ── Main grid: chart + gauges + service health ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* P95 Latency area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><Activity className="w-4 h-4 text-brand-500" /> P95 API Latency by Endpoint</CardTitle>
            <Badge variant="blue" dot>PromQL Live</Badge>
          </CardHeader>
          <CardBody className="pt-3">
            {latencyChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-ink-3">
                <Activity className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No Prometheus data</p>
                <p className="text-xs text-ink-3 text-center max-w-xs">
                  Start Prometheus and ensure it scrapes <code className="bg-divider px-1 rounded">:8000/metrics</code>
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={latencyChartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} unit="ms" />
                  <Tooltip content={<CustomTooltip unit="ms" />} />
                  <Bar dataKey="ms" fill="#0073E6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Infra service health */}
        <Card>
          <CardHeader>
            <CardTitle><Server className="w-4 h-4 text-ok" /> Infrastructure Health</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {[
              { key: 'backend',    label: 'Backend API',    status: isHealthy ? 'healthy' : 'unreachable',    port: '8000',  color: '#0073E6' },
              { key: 'prometheus', label: 'Prometheus',     status: services['prometheus']?.status  ?? 'unreachable', port: '9090',  color: '#E85D26' },
              { key: 'grafana',    label: 'Grafana',        status: services['grafana']?.status     ?? 'unreachable', port: '3000',  color: '#C97500' },
              { key: 'loki',       label: 'Loki',           status: services['loki']?.status        ?? 'unreachable', port: '3100',  color: '#6B2FF2' },
              { key: 'jaeger',     label: 'Jaeger',         status: services['jaeger']?.status      ?? 'unreachable', port: '16686', color: '#007B8A' },
              { key: 'otelCollector', label: 'OTel Collector', status: services['otelCollector']?.status ?? 'unreachable', port: '4317', color: '#BC0070' },
            ].map(({ key, label, status, port, color }) => {
              const isUp  = status === 'healthy' || status === 'operational' || status === 'connected';
              const isPend = status === 'reconnecting';
              return (
                <div key={key} className="flex items-center justify-between px-5 py-3 border-b border-divider last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0',
                      isUp ? 'animate-pulse2' : ''
                    )} style={{ background: isUp ? '#0D8A4E' : isPend ? '#C97500' : '#D93025' }} />
                    <div>
                      <p className="text-xs font-semibold text-ink">{label}</p>
                      <p className="text-xs font-mono text-ink-3">:{port}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {services[key]?.responseTime && isUp && (
                      <span className="text-xs font-mono text-ink-2">{services[key].responseTime}ms</span>
                    )}
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded border font-mono',
                      isUp ? 'text-ok-text bg-ok-light border-ok-mid'
                        : isPend ? 'text-warn-text bg-warn-light border-warn-mid'
                        : 'text-crit-text bg-crit-light border-crit-mid'
                    )}>
                      {isUp ? 'UP' : isPend ? 'PEND' : 'DOWN'}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* ── Gauges row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle><Cpu className="w-4 h-4 text-brand-500" /> Host CPU</CardTitle></CardHeader>
          <CardBody className="flex flex-col items-center gap-2">
            <Gauge value={cpuVal} label="% CPU Usage" size={140} />
            <div className="w-full">
              <Sparkline data={Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i * 0.7) * 15 + Math.random() * 8)} color="#0073E6" height={36} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle><Database className="w-4 h-4 text-violet-DEFAULT" /> Memory</CardTitle></CardHeader>
          <CardBody className="flex flex-col items-center gap-2">
            <Gauge value={memVal} label="% Memory Usage" size={140} />
            <div className="w-full">
              <Sparkline data={Array.from({ length: 20 }, (_, i) => 60 + Math.cos(i * 0.5) * 10 + Math.random() * 5)} color="#6B2FF2" height={36} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle><Server className="w-4 h-4 text-teal-DEFAULT" /> Disk I/O</CardTitle></CardHeader>
          <CardBody className="flex flex-col items-center gap-2">
            <Gauge value={diskVal} label="% Disk Usage" size={140} />
            <div className="w-full">
              <Sparkline data={Array.from({ length: 20 }, (_, i) => 20 + Math.sin(i * 0.3) * 12 + Math.random() * 6)} color="#007B8A" height={36} />
            </div>
          </CardBody>
        </Card>
        {/* Request rate bar */}
        <Card>
          <CardHeader><CardTitle><Activity className="w-4 h-4 text-coral-DEFAULT" /> Req / min</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={reqChartData} barSize={18} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#374151' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {reqChartData.map((d) => (
                  <Bar key={d.name} dataKey="v" fill={d.fill} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-ink-2 mt-1">Requests by endpoint</p>
          </CardBody>
        </Card>
      </div>

      {/* ── Exchange connectivity ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle><Wifi className="w-4 h-4 text-brand-500" /> Exchange Connectivity</CardTitle>
          <StatusChip status={deltaOk} label={deltaOk ? 'Delta Live' : 'Delta Offline'} />
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            {[
              { label: 'REST URL',      value: statusData?.exchangeConnectivity?.deltaExchange?.restUrl ?? '—', color: 'text-brand-600' },
              { label: 'Reachable',     value: deltaOk ? 'YES' : 'NO', color: deltaOk ? 'text-ok' : 'text-crit' },
              { label: 'WS URL',        value: statusData?.exchangeConnectivity?.deltaExchange?.wsUrl ?? '—', color: 'text-violet-DEFAULT' },
              { label: 'API Key',       value: statusData?.exchangeConnectivity?.deltaExchange?.maskedApiKey ?? '—', color: 'text-ink' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-raised rounded-md border border-divider p-3">
                <p className="text-ink-2 mb-1 uppercase tracking-wide text-xs">{label}</p>
                <p className={cn('font-semibold truncate', color)}>{value}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
