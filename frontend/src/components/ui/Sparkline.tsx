/**
 * Sparkline — thin responsive area/line chart for metric cards.
 */
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0073E6',
  height = 48,
  showTooltip = false,
}) => {
  const points = data.map((v, i) => ({ i, v }));
  if (points.length < 2) return null;
  const id = `spark-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {showTooltip && (
          <Tooltip
            contentStyle={{ fontSize: 11, background: '#fff', border: '1px solid #D1D9E0', borderRadius: 6 }}
            formatter={(v: any) => [v, '']}
            labelFormatter={() => ''}
          />
        )}
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${id})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
