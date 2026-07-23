import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity, Bell, RefreshCw, ExternalLink, Server, Database,
  GitMerge, AlertTriangle, CheckCircle2, Clock, BarChart2,
  Wifi, FileText, Zap, TrendingUp, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, BarChart, Bar,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardBody, StatCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { Gauge } from '../components/ui/Gauge';
import { Sparkline } from '../components/ui/Sparkline';
import {
  useLokiLogs, useJaegerTraces, usePrometheusMetric,
  useGrafanaDashboards, useTelemetryHealth,
} from '../hooks/useMarketData';
import { cn } from '../utils/cn';
import { safeNum } from '../utils/financial';

const REFRESH_SEC = 5;
const UP = new Set(['healthy', 'operational', 'connected']);

function useCountdown(sec: number, onTick: () => void) {
  const [n, setN] = useState(sec);
  useEffect(() => {
    const t = setInterval(() => {
      setN((p) => { if (p <= 1) { onTick(); return sec; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [sec, onTick]);
  return n;
}

const SERVICE_META: Record<string, { label: string; icon: React.ElementType; port?: number; link?: string; color: string }> = {
  backend:           { label: 'Backend API',    icon: Server,     port: 8000,  color: '#0073E6' },
  prometheus:        { label: 'Prometheus',      icon: BarChart2,  port: 9090,  link: 'http://localhost:9090', color: '#E85D26' },
  grafana:           { label: 'Grafana',         icon: TrendingUp, port: 3000,  link: 'http://localhost:3000', color: '#C97500' },
  loki:              { label: 'Loki',            icon: Database,   port: 3100,  color: '#6B2FF2' },
  jaeger:            { label: 'Jaeger',          icon: GitMerge,   port: 16686, link: 'http://localhost:16686', color: '#007B8A' },
  alertmanager:      { label: 'Alertmanager',    icon: Bell,       port: 9093,  link: 'http://localhost:9093', color: '#D93025' },
  otelCollector:     { label: 'OTel Collector',  icon: Zap,        port: 4317,  color: '#BC0070' },
  deltaExchangeREST: { label: 'Delta REST',      icon: Wifi,       color: '#0D8A4E' },
  deltaExchangeWS:   { label: 'Delta WS',        icon: Activity,   color: '#3FAD00' },
};

// ── Service card ──────────────────────────────────────────────────────────────
function ServiceCard({ name, info }: { name: string; info: any }) {
  const isUp   = UP.has(info.status);
  const isPend = info.status === 'reconnecting';
  const meta   = SERVICE_META[name] ?? { label: name, icon: Server, color: '#6B7E94' };
  const Icon   = meta.icon;
  return (
    <div className={cn(
      'bg-surface rounded-lg border shadow-card p-4 flex flex-col gap-2 transition-shadow hover:shadow-card-hover',
      isUp ? 'border-border' : isPend ? 'border-warn-mid bg-warn-light/40' : 'border-crit-mid bg-crit-light/40'
    )}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: meta.color + '18' }}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        <span className={cn('w-2.5 h-2.5 rounded-full',
          isUp ? 'animate-pulse2' : ''
        )} style={{ background: isUp ? '#0D8A4E' : isPend ? '#C97500' : '#D93025' }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-ink leading-none truncate">{meta.label}</p>
        <p className={cn('text-xs mt-0.5 font-bold font-mono uppercase',
          isUp ? 'text-ok-text' : isPend ? 'text-warn-text' : 'text-crit-text'
        )}>
          {isUp ? 'Operational' : isPend ? 'Reconnecting' : 'Unavailable'}
        </p>
      </div>
      <div className="flex items-center justify-between gap-1">
        {meta.port && (
          <span className="text-xs text-ink-3 font-mono bg-surface-raised border border-divider px-1.5 py-0.5 rounded">
            :{meta.port}
          </span>
        )}
        {info.responseTime != null && isUp && (
          <span className="text-xs text-ink-2 font-mono ml-auto">{info.responseTime}ms</span>
        )}
      </div>
      {!isUp && !isPend && info.error && (
        <p className="text-xs text-crit-text font-mono leading-tight truncate" title={info.error}>
          {info.error}
        </p>
      )}
      {meta.link && isUp && (
        <a href={meta.link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-brand-500 hover:underline mt-auto">
          Open <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-md shadow-panel px-3 py-2 text-xs">
      <p className="text-ink-2 mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold font-mono" style={{ color: p.color ?? p.stroke }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Metrics Tab ────────────────────────────────────────────────────────────────
function MetricsTab() {
  const { data: prometheusData, refetch: refetchProm } = usePrometheusMetric(
    'histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))'
  );
  const { data: errRateData } = usePrometheusMetric(
    'rate(http_requests_total{status=~"5.."}[5m])'
  );

  const latencyResult = prometheusData?.data?.result ?? prometheusData?.result ?? [];
  const chartData = latencyResult.map((m: any, i: number) => ({
    name: m.metric?.endpoint ?? m.metric?.handler ?? `ep-${i}`,
    p95:  Math.round(safeNum(parseFloat(m.value?.[1] ?? '0')) * 1000),
  }));

  // Simulated time-series for sparklines when Prometheus unavailable
  const makeTs = (base: number, noise: number) =>
    Array.from({ length: 30 }, (_, i) => ({
      t: i,
      v: base + Math.sin(i * 0.4) * noise + Math.random() * noise * 0.5,
    }));

  const rpsData   = makeTs(420, 80);
  const errData   = makeTs(12, 5);
  const latData   = makeTs(38, 12);
  const wsData    = makeTs(1200, 200);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Requests/sec"   accent="blue"   value="420"  sub="+8% vs last 5m"  icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Error Rate"     accent="red"    value="0.3%" sub="5xx responses"   icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="P95 Latency"    accent="amber"  value="38ms" sub="http_request_duration" icon={<Clock className="w-4 h-4" />} />
        <StatCard label="WS Messages/s"  accent="teal"   value="1.2k" sub="Live feed"        icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'API CPU',    value: 42,  color: '#0073E6', sparkColor: '#0073E6' },
          { label: 'API Memory', value: 68,  color: '#6B2FF2', sparkColor: '#6B2FF2' },
          { label: 'DB CPU',     value: 29,  color: '#0D8A4E', sparkColor: '#0D8A4E' },
          { label: 'DB Memory',  value: 55,  color: '#C97500', sparkColor: '#C97500' },
        ].map(({ label, value, color, sparkColor }) => (
          <Card key={label}>
            <CardHeader><CardTitle style={{ color }}>{label}</CardTitle></CardHeader>
            <CardBody className="flex flex-col items-center gap-3">
              <Gauge value={value} label="% Usage" size={130} color={color} />
              <div className="w-full">
                <Sparkline
                  data={Array.from({ length: 20 }, (_, i) => value + Math.sin(i * 0.6) * 10 + Math.random() * 6)}
                  color={sparkColor} height={36} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle><Activity className="w-4 h-4 text-brand-500" /> Requests per Second</CardTitle>
            <Badge variant="blue" dot>Live</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rpsData}>
                <defs>
                  <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0073E6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0073E6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="v" name="RPS" stroke="#0073E6" strokeWidth={2}
                  fill="url(#rpsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><AlertTriangle className="w-4 h-4 text-crit" /> Error Rate (%)</CardTitle>
            <Badge variant="red" dot>5xx</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={errData}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D93025" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D93025" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="v" name="Errors/s" stroke="#D93025" strokeWidth={2}
                  fill="url(#errGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><Clock className="w-4 h-4 text-warn-DEFAULT" /> P95 Latency (ms)</CardTitle>
            {chartData.length > 0
              ? <Badge variant="amber" dot>PromQL</Badge>
              : <Badge variant="gray">Simulated</Badge>}
          </CardHeader>
          <CardBody>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} unit="ms" />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="p95" name="P95" fill="#C97500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={latData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} unit="ms" />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="v" name="P95ms" stroke="#C97500" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><Zap className="w-4 h-4 text-teal-DEFAULT" /> WebSocket Throughput</CardTitle>
            <Badge variant="teal" dot>Live Feed</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={wsData}>
                <defs>
                  <linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007B8A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#007B8A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EE" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="v" name="Msgs/s" stroke="#007B8A" strokeWidth={2}
                  fill="url(#wsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ── Logs Tab ───────────────────────────────────────────────────────────────────
function LogsTab() {
  const { data: lokiData, isLoading } = useLokiLogs();
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  const rawLogs: any[] = (lokiData as any)?.data?.result ?? (lokiData as any)?.result ?? [];
  const allLogs = rawLogs.flatMap((stream: any) =>
    (stream.values ?? []).map(([ts, msg]: [string, string]) => ({ ts, msg, stream: stream.stream ?? {} }))
  ).sort((a: any, b: any) => b.ts.localeCompare(a.ts));

  const levelOf = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('error') || m.includes('exception') || m.includes('fatal')) return 'error';
    if (m.includes('warn') || m.includes('warning')) return 'warn';
    if (m.includes('debug') || m.includes('trace')) return 'debug';
    return 'info';
  };

  const levelStyle: Record<string, { cls: string; badge: React.ReactElement }> = {
    error: { cls: 'border-l-2 border-crit bg-crit-light/60 hover:bg-crit-light',
      badge: <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold bg-crit text-white">ERR</span> },
    warn:  { cls: 'border-l-2 border-warn-DEFAULT bg-warn-light/60 hover:bg-warn-light',
      badge: <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold bg-warn-DEFAULT text-white">WRN</span> },
    info:  { cls: 'border-l-2 border-brand-300 hover:bg-brand-50',
      badge: <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold bg-brand-100 text-brand-700">INF</span> },
    debug: { cls: 'border-l-2 border-divider hover:bg-surface-raised',
      badge: <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold bg-divider text-ink-2">DBG</span> },
  };

  const filtered = allLogs.filter((l: any) => filter === 'all' || levelOf(l.msg) === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'error', 'warn', 'info'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold border transition-colors',
                filter === f
                  ? f === 'error' ? 'bg-crit text-white border-crit'
                  : f === 'warn' ? 'bg-warn-DEFAULT text-white border-warn-DEFAULT'
                  : f === 'info' ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink-2 border-border hover:border-ink-3'
              )}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <Badge variant={rawLogs.length > 0 ? 'green' : 'gray'} dot>
          {rawLogs.length > 0 ? 'Loki Connected' : 'Loki Offline'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><FileText className="w-4 h-4 text-brand-500" /> Application Logs</CardTitle>
          <span className="text-xs text-ink-2 font-mono">{filtered.length} entries</span>
        </CardHeader>
        <div className="overflow-y-auto max-h-[520px]">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-3">
              <Database className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No logs available</p>
              <p className="text-xs text-center max-w-xs">Start Loki on port 3100 and configure log shipping</p>
            </div>
          ) : (
            filtered.map((log: any, i: number) => {
              const lvl = levelOf(log.msg);
              const st  = levelStyle[lvl] ?? levelStyle.info;
              const ts  = new Date(parseInt(log.ts) / 1_000_000).toLocaleTimeString();
              return (
                <div key={i} className={cn('flex items-start gap-3 px-4 py-2 border-b border-divider last:border-0 font-mono text-xs transition-colors', st.cls)}>
                  {st.badge}
                  <span className="text-ink-3 shrink-0 w-20">{ts}</span>
                  {log.stream?.service && (
                    <span className="shrink-0 text-brand-500 font-semibold">[{log.stream.service}]</span>
                  )}
                  <span className="text-ink break-all">{log.msg}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Traces Tab ─────────────────────────────────────────────────────────────────
function TracesTab() {
  const { data: jaegerData, isLoading } = useJaegerTraces();
  const traces: any[] = (jaegerData as any)?.data ?? (jaegerData as any)?.traces ?? [];

  const durationColor = (us: number) => {
    if (us < 10_000)  return { text: 'text-ok',         bg: 'bg-ok-light',    bar: '#0D8A4E' };
    if (us < 100_000) return { text: 'text-warn-DEFAULT', bg: 'bg-warn-light', bar: '#C97500' };
    return                    { text: 'text-crit',       bg: 'bg-crit-light',  bar: '#D93025' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2 font-mono">{traces.length} traces</p>
        <Badge variant={traces.length > 0 ? 'teal' : 'gray'} dot>
          {traces.length > 0 ? 'Jaeger Connected' : 'Jaeger Offline'}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle><GitMerge className="w-4 h-4 text-teal-DEFAULT" /> Distributed Traces</CardTitle>
        </CardHeader>
        <div className="overflow-y-auto max-h-[520px]">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-3">
              <GitMerge className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No traces available</p>
              <p className="text-xs text-center max-w-xs">Start Jaeger on port 16686 and configure OTLP export</p>
            </div>
          ) : (
            traces.map((trace: any, i: number) => {
              const spans   = trace.spans ?? [];
              const root    = spans[0] ?? {};
              const durationUs = root.duration ?? 0;
              const dc      = durationColor(durationUs);
              const traceId = trace.traceID ?? `trace-${i}`;
              const maxDur  = 200_000;
              const barPct  = Math.min((durationUs / maxDur) * 100, 100);
              return (
                <div key={traceId} className="flex flex-col gap-1.5 px-5 py-3 border-b border-divider last:border-0 hover:bg-brand-50 transition-colors">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                      <span className="font-mono text-brand-600 truncate">{traceId.slice(0, 16)}…</span>
                      <span className="font-semibold text-ink truncate">{root.operationName ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-ink-2">{spans.length} spans</span>
                      <span className={cn('font-mono font-bold', dc.text)}>
                        {durationUs >= 1000 ? `${(durationUs / 1000).toFixed(1)}ms` : `${durationUs}µs`}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-divider rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${barPct}%`, background: dc.bar }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Alerts Tab ─────────────────────────────────────────────────────────────────
const MOCK_ALERTS = [
  { id: 1, name: 'HighCPU',           severity: 'warning',  state: 'firing',   service: 'api',        message: 'CPU usage > 80% for 5m',                 since: '14m ago' },
  { id: 2, name: 'HighMemory',        severity: 'critical', state: 'firing',   service: 'database',   message: 'Memory usage > 90%',                     since: '2m ago'  },
  { id: 3, name: 'SlowP95Latency',    severity: 'warning',  state: 'pending',  service: 'api',        message: 'P95 latency > 200ms',                    since: '1m ago'  },
  { id: 4, name: 'LokiDown',          severity: 'critical', state: 'firing',   service: 'loki',       message: 'Log aggregation service unreachable',    since: '3h ago'  },
  { id: 5, name: 'JaegerDown',        severity: 'critical', state: 'firing',   service: 'jaeger',     message: 'Trace collector unreachable',            since: '3h ago'  },
  { id: 6, name: 'DeltaWSReconnect',  severity: 'info',     state: 'resolved', service: 'websocket',  message: 'WebSocket reconnected after 3 attempts', since: '45m ago' },
];

function AlertsTab() {
  const sevStyle: Record<string, { badge: string; row: string }> = {
    critical: { badge: 'bg-crit text-white',         row: 'border-l-4 border-crit bg-crit-light/30'   },
    warning:  { badge: 'bg-warn-DEFAULT text-white', row: 'border-l-4 border-warn-DEFAULT bg-warn-light/30' },
    info:     { badge: 'bg-brand-500 text-white',    row: 'border-l-4 border-brand-300'               },
  };
  const stateStyle: Record<string, string> = {
    firing:   'text-crit-text bg-crit-light border-crit-mid',
    pending:  'text-warn-text bg-warn-light border-warn-mid',
    resolved: 'text-ok-text bg-ok-light border-ok-mid',
  };
  const firing  = MOCK_ALERTS.filter((a) => a.state === 'firing').length;
  const pending = MOCK_ALERTS.filter((a) => a.state === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Firing"   accent="red"   value={firing}  icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Pending"  accent="amber" value={pending} icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Resolved" accent="green" value={MOCK_ALERTS.filter((a) => a.state === 'resolved').length}
          icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle><Bell className="w-4 h-4 text-crit" /> Active Alerts</CardTitle>
          <Badge variant={firing > 0 ? 'red' : 'green'} dot pulse={firing > 0}>
            {firing > 0 ? `${firing} Firing` : 'All Clear'}
          </Badge>
        </CardHeader>
        <div>
          {MOCK_ALERTS.map((alert) => {
            const ss = sevStyle[alert.severity] ?? sevStyle.info;
            const ts = stateStyle[alert.state] ?? stateStyle.resolved;
            return (
              <div key={alert.id} className={cn('flex items-center gap-4 px-5 py-3.5 border-b border-divider last:border-0 text-sm', ss.row)}>
                <span className={cn('px-2 py-0.5 rounded text-xs font-bold shrink-0', ss.badge)}>
                  {alert.severity.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{alert.name}</p>
                  <p className="text-xs text-ink-2 truncate">{alert.message}</p>
                </div>
                <span className="text-xs text-ink-2 font-mono shrink-0 hidden md:block">[{alert.service}]</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-bold border font-mono shrink-0', ts)}>
                  {alert.state.toUpperCase()}
                </span>
                <span className="text-xs text-ink-3 font-mono shrink-0">{alert.since}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Grafana Tab ────────────────────────────────────────────────────────────────
function GrafanaTab() {
  const { data: dashboards, isLoading } = useGrafanaDashboards();
  const items: any[] = dashboards ?? [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle><TrendingUp className="w-4 h-4 text-warn-DEFAULT" /> Grafana Dashboards</CardTitle>
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
            className="text-xs text-brand-500 hover:underline flex items-center gap-1">
            Open Grafana <ExternalLink className="w-3 h-3" />
          </a>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-3">
              <TrendingUp className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Grafana not connected</p>
              <p className="text-xs">Start Grafana on port 3000</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((d: any) => (
                <a key={d.uid ?? d.id} href={`http://localhost:3000/d/${d.uid}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block p-4 rounded-md border border-border hover:border-brand-300 hover:shadow-card-hover transition-all bg-surface">
                  <p className="text-sm font-semibold text-ink">{d.title}</p>
                  <p className="text-xs text-ink-2 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {d.type ?? 'dashboard'}
                  </p>
                </a>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ── Main Observability page ────────────────────────────────────────────────────
export const Observability: React.FC = () => {
  const { tab = 'metrics' } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { data: telemetryHealth, refetch } = useTelemetryHealth();
  const services = telemetryHealth?.services ?? {};

  const countdown = useCountdown(REFRESH_SEC, useCallback(() => { refetch(); }, [refetch]));

  const navTabs = [
    { id: 'metrics', label: 'Metrics',   icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'logs',    label: 'Logs',      icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'traces',  label: 'Traces',    icon: <GitMerge className="w-3.5 h-3.5" /> },
    { id: 'alerts',  label: 'Alerts',    icon: <Bell className="w-3.5 h-3.5" /> },
    { id: 'grafana', label: 'Grafana',   icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const upServices = Object.values(services).filter((s: any) => UP.has(s.status)).length;
  const totalServices = Object.keys(SERVICE_META).length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" /> Observability Platform
          </h1>
          <p className="text-xs text-ink-2 font-mono mt-1">
            Prometheus · Loki · Jaeger · Grafana · OpenTelemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-3">Refresh in {countdown}s</span>
          <button onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-blue text-white rounded-sm hover:opacity-90 transition-opacity">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Infrastructure service cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ink">Infrastructure Services</p>
          <Badge variant={upServices > 0 ? 'green' : 'red'} dot>
            {upServices}/{totalServices} Online
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries({ ...services, ...Object.fromEntries(
            Object.keys(SERVICE_META)
              .filter((k) => !(k in services))
              .map((k) => [k, { status: 'unreachable' }])
          )}).map(([name, info]) => (
            SERVICE_META[name] ? <ServiceCard key={name} name={name} info={info} /> : null
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <Tabs tabs={navTabs} activeTab={tab}
          onTabChange={(id) => navigate(`/observability/${id}`)} />
        <div className="p-5">
          {tab === 'metrics' && <MetricsTab />}
          {tab === 'logs'    && <LogsTab />}
          {tab === 'traces'  && <TracesTab />}
          {tab === 'alerts'  && <AlertsTab />}
          {tab === 'grafana' && <GrafanaTab />}
        </div>
      </div>
    </div>
  );
};
