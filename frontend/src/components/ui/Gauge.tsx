/**
 * Gauge — SVG arc radial gauge.
 * Matches the circular CPU/Memory gauges seen in AWS Observability dashboards.
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface GaugeProps {
  value: number;       // 0–100
  max?: number;        // default 100
  label?: string;      // e.g. "% CPU Usage"
  size?: number;       // px diameter, default 140
  strokeWidth?: number;
  color?: string;      // hex or tailwind class-safe hex
  className?: string;
  unit?: string;
}

function lerp(v: number, lo: number, hi: number): string {
  // dark colors for good readability
  if (v < 50)  return '#065F2C'; // dark green
  if (v < 75)  return '#92400E'; // dark amber
  return '#991B1B';               // dark red
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  label = '% Usage',
  size = 140,
  strokeWidth = 10,
  color,
  className,
  unit = '',
}) => {
  const pct     = Math.min(Math.max(value / max, 0), 1);
  const r       = (size - strokeWidth * 2) / 2;
  const cx      = size / 2;
  const cy      = size / 2;

  // Arc: start at -220deg, sweep 260deg
  const startDeg = -220;
  const sweepDeg = 260;
  const endDeg   = startDeg + sweepDeg * pct;

  function polar(deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const start = polar(startDeg);
  const end   = polar(endDeg);
  const arc   = polar(startDeg + sweepDeg);

  const fullArc = sweepDeg * pct >= 180;

  const trackPath = (() => {
    const s = polar(startDeg);
    const e = polar(startDeg + sweepDeg);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  })();

  const fillPath = pct === 0
    ? ''
    : `M ${start.x} ${start.y} A ${r} ${r} 0 ${fullArc ? 1 : 0} 1 ${end.x} ${end.y}`;

  const strokeColor = color ?? lerp(pct * 100, 0, 100);
  const displayVal  = Number.isFinite(value) ? value.toFixed(value < 10 ? 2 : 1) : '—';

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#E4E8EE"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {pct > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.17}
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          fill={strokeColor}
        >
          {displayVal}
        </text>
        {/* Min / Max ticks */}
        <text x={polar(startDeg).x - 4} y={polar(startDeg).y + 4}
          fontSize="9" fill="#374151" textAnchor="middle">0</text>
        <text x={polar(startDeg + sweepDeg).x + 2} y={polar(startDeg + sweepDeg).y + 4}
          fontSize="9" fill="#374151" textAnchor="middle">{max}</text>
      </svg>
      {label && (
        <p className="text-xs text-ink-2 font-semibold text-center leading-tight -mt-1">{label}</p>
      )}
    </div>
  );
};
