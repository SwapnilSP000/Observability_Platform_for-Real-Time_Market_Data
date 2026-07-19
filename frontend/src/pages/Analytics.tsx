import React from 'react';
import { BarChart3, TrendingUp, Cpu, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

const volumeData = [
  { day: 'Mon', vol: 120 },
  { day: 'Tue', vol: 180 },
  { day: 'Wed', vol: 240 },
  { day: 'Thu', vol: 310 },
  { day: 'Fri', vol: 290 },
  { day: 'Sat', vol: 150 },
  { day: 'Sun', vol: 210 },
];

const pnlCurveData = [
  { day: 'Day 1', pnl: 1000 },
  { day: 'Day 2', pnl: 1400 },
  { day: 'Day 3', pnl: 1100 },
  { day: 'Day 4', pnl: 2200 },
  { day: 'Day 5', pnl: 3500 },
  { day: 'Day 6', pnl: 4375 },
];

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" /> Platform & Execution Analytics
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Historical volume metrics, cumulative profit curves, and latency distribution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative PnL Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Cumulative PnL Performance ($)
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlCurveData}>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1E293B', color: '#F8FAFC' }} />
                <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 7-Day Trading Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> 7-Day Notional Volume ($M)
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1E293B', color: '#F8FAFC' }} />
                <Bar dataKey="vol" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
