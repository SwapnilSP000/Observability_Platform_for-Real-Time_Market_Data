import React from 'react';
import { BarChart3, Activity, RefreshCw, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { usePrometheusMetric, useMarketTickers } from '../hooks/useMarketData';

export const Analytics: React.FC = () => {
  const { data: metricsData, isLoading: isLoadingMetrics, refetch } = usePrometheusMetric('http_requests_total');
  const { data: tickersData } = useMarketTickers();

  const tickers = tickersData?.tickers || [];

  // Parse Prometheus vector metric results directly from backend Prometheus query API
  const prometheusResult = metricsData?.data?.result || metricsData?.result || [];

  const requestsChartData = prometheusResult.map((m: any, idx: number) => {
    const endpoint = m.metric?.endpoint || m.metric?.handler || `endpoint_${idx + 1}`;
    const value = parseFloat(m.value?.[1] || 0);
    return {
      name: endpoint,
      count: value,
    };
  });

  const volumeData = tickers
    .filter((t) => !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-') && t.volume && t.volume > 0)
    .slice(0, 8)
    .map((t) => ({
      name: t.symbol,
      volume: Number(((t.volume ?? 0) / 1_000_000).toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Platform & Execution Analytics
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real Prometheus PromQL metrics and market ticker volume metrics (Refreshes live every 5s)
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prometheus Request Volume by Endpoint */}
        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> Prometheus HTTP Requests Total
              </span>
              <Badge variant="success">PromQL: http_requests_total</Badge>
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            {isLoadingMetrics ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : requestsChartData.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No Prometheus vector metrics returned from <code>http://localhost:9090</code>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsChartData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1E293B', color: '#F8FAFC' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* 24h Exchange Notional Trading Volume */}
        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> 24h Exchange Notional Volume ($M)
              </span>
              <Badge variant="info">Live Delta Exchange Tickers</Badge>
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            {volumeData.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Connecting to live Delta Exchange market tickers...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1E293B', color: '#F8FAFC' }} />
                  <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
