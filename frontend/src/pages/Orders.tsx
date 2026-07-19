import React, { useState } from 'react';
import { ListOrdered, Search, Filter, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Orders: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const ordersList = [
    { id: 'ORD-8921', symbol: 'BTC-PERP', side: 'BUY', type: 'LIMIT', price: 64000.0, size: 1.0, filled: 1.0, status: 'FILLED', time: '2026-07-20 00:25:12' },
    { id: 'ORD-8922', symbol: 'ETH-PERP', side: 'SELL', type: 'LIMIT', price: 3500.0, size: 5.0, filled: 0.0, status: 'OPEN', time: '2026-07-20 00:28:40' },
    { id: 'ORD-8923', symbol: 'SOL-PERP', side: 'BUY', type: 'MARKET', price: 145.0, size: 20.0, filled: 20.0, status: 'FILLED', time: '2026-07-20 00:31:05' },
    { id: 'ORD-8924', symbol: 'BTC-PERP', side: 'SELL', type: 'STOP_LIMIT', price: 63500.0, size: 0.5, filled: 0.0, status: 'CANCELLED', time: '2026-07-20 00:33:18' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-400" /> Order History & Execution Audit
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Complete list of submitted limit, market, and stop orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded border ${filter === 'all' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'}`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1 rounded border ${filter === 'open' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'}`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('filled')}
              className={`px-3 py-1 rounded border ${filter === 'filled' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'}`}
            >
              Filled
            </button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Time (UTC)</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Limit Price</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Filled</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersList.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell className="font-bold text-slate-200">{ord.id}</TableCell>
                <TableCell className="text-slate-400">{ord.time}</TableCell>
                <TableCell className="font-semibold">{ord.symbol}</TableCell>
                <TableCell>
                  <Badge variant={ord.side === 'BUY' ? 'success' : 'danger'}>{ord.side}</Badge>
                </TableCell>
                <TableCell className="text-slate-300">{ord.type}</TableCell>
                <TableCell>${ord.price.toLocaleString('en-US')}</TableCell>
                <TableCell>{ord.size}</TableCell>
                <TableCell>{ord.filled}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ord.status === 'FILLED'
                        ? 'success'
                        : ord.status === 'OPEN'
                        ? 'info'
                        : 'muted'
                    }
                  >
                    {ord.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
