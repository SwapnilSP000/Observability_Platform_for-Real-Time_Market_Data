import React from 'react';
import { useTelemetryHealth } from '../../hooks/useMarketData';
import { getLatestApiMetrics } from '../../api/client';
import { useHealth } from '../../hooks/useSystemStatus';
import { cn } from '../../utils/cn';

const UP = new Set(['healthy', 'operational', 'connected']);

const Dot: React.FC<{ name: string; status: string }> = ({ name, status }) => {
  const isUp  = UP.has(status);
  const isPend = status === 'reconnecting';
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={cn(
        'w-2 h-2 rounded-full',
        isUp ? 'bg-ok animate-pulse2' : isPend ? 'bg-warn-DEFAULT' : 'bg-crit'
      )} />
      <span className={cn(
        'text-xs font-mono font-semibold',
        isUp ? 'text-ink-2' : isPend ? 'text-warn-text font-bold' : 'text-crit-text font-bold'
      )}>
        {name}
      </span>
    </div>
  );
};

export const SystemStatusBar: React.FC = () => {
  const { data: telemetryHealth } = useTelemetryHealth();
  const { data: healthData }      = useHealth();
  const metrics = getLatestApiMetrics();
  const services     = telemetryHealth?.services || {};
  const serviceOrder = ['backend', 'prometheus', 'loki', 'jaeger', 'alertmanager', 'otelCollector'];
  const backendUp    = healthData?.status === 'healthy' || healthData?.status === 'operational';

  return (
    <footer className="h-8 shrink-0 bg-surface border-t border-divider px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 overflow-x-auto min-w-0">
        <span className="text-xs text-ink-2 font-mono font-semibold uppercase shrink-0">INFRA</span>
        <div className="w-px h-4 bg-divider shrink-0" />
        <Dot name="api" status={backendUp ? 'healthy' : 'unreachable'} />
        {serviceOrder.filter((s) => s !== 'backend').map((key) => (
          <Dot key={key} name={key === 'otelCollector' ? 'otel' : key}
            status={services[key]?.status ?? 'unreachable'} />
        ))}
      </div>
      <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
        {metrics.latencyMs !== null && (
          <span className="text-xs text-ink-2 font-mono">
            Latency:{' '}
            <span className={cn('font-bold',
              metrics.latencyMs < 200 ? 'text-ok-text' :
              metrics.latencyMs < 800 ? 'text-warn-text' : 'text-crit-text'
            )}>
              {metrics.latencyMs}ms
            </span>
          </span>
        )}
        <span className="text-xs text-ink-2 font-mono">
          Req: <span className="text-ink font-bold">{metrics.requestCount}</span>
        </span>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-bold border',
          backendUp ? 'text-ok-text bg-ok-light border-ok-mid' : 'text-crit-text bg-crit-light border-crit-mid'
        )}>
          {backendUp ? '● LIVE' : '● DEGRADED'}
        </span>
      </div>
    </footer>
  );
};
