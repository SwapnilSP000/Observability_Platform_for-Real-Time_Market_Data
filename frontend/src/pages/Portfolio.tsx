import React from 'react';
import { Briefcase, Wallet, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

export const Portfolio: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" /> Account Portfolio & Asset Allocation
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Margin balances, unrealized equity, and risk limits
          </p>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover>
          <p className="text-xs text-slate-400 font-mono">TOTAL EQUITY</p>
          <p className="text-2xl font-bold text-slate-100 font-mono mt-1">$25,000.00</p>
          <span className="text-xs text-emerald-400 flex items-center mt-2 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18.5% Total PnL
          </span>
        </Card>

        <Card hover>
          <p className="text-xs text-slate-400 font-mono">AVAILABLE MARGIN</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">$18,437.50</p>
          <span className="text-xs text-slate-500 mt-2 block font-mono">73.75% Free</span>
        </Card>

        <Card hover>
          <p className="text-xs text-slate-400 font-mono">USED MARGIN</p>
          <p className="text-2xl font-bold text-blue-400 font-mono mt-1">$6,562.50</p>
          <span className="text-xs text-slate-500 mt-2 block font-mono">26.25% Utilized</span>
        </Card>

        <Card hover>
          <p className="text-xs text-slate-400 font-mono">UNREALIZED PNL</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">+$4,375.00</p>
          <span className="text-xs text-emerald-400 mt-2 block font-mono">3 Active Positions</span>
        </Card>
      </div>

      {/* Asset Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" /> Collateral & Asset Holdings
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Total Balance</TableHead>
              <TableHead>Available Balance</TableHead>
              <TableHead>In Orders</TableHead>
              <TableHead>USD Value</TableHead>
              <TableHead>Allocation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">₮</span>
                <span>USDT</span>
              </TableCell>
              <TableCell>15,000.00 USDT</TableCell>
              <TableCell className="text-emerald-400">12,000.00 USDT</TableCell>
              <TableCell>3,000.00 USDT</TableCell>
              <TableCell className="font-bold">$15,000.00</TableCell>
              <TableCell><Badge variant="info">60.0%</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">₿</span>
                <span>BTC</span>
              </TableCell>
              <TableCell>0.155 BTC</TableCell>
              <TableCell className="text-emerald-400">0.100 BTC</TableCell>
              <TableCell>0.055 BTC</TableCell>
              <TableCell className="font-bold">$10,000.00</TableCell>
              <TableCell><Badge variant="info">40.0%</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
