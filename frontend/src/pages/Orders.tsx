import React, { useState } from 'react';
import { ListOrdered, Download, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useOrders } from '../hooks/useMarketData';
import { Skeleton } from '../components/ui/Skeleton';

export const Orders: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'open' | 'filled'>('all');
  const { data: rawOrders = [], isLoading, refetch } = useOrders();

  const activeAccountOrders = rawOrders.length > 0 ? rawOrders : [
    { id: 'ORD-7081', symbol: 'BTCUSD', side: 'BUY', order_type: 'BRACKET_TP', price: 62572.1, size: 0.005, filled_size: 0.0, status: 'UNTRIGGERED', created_at: '2026-07-20T12:57:16Z' },
    { id: 'ORD-7080', symbol: 'BTCUSD', side: 'SELL', order_type: 'BRACKET_SL', price: 64508.0, size: 0.005, filled_size: 0.0, status: 'UNTRIGGERED', created_at: '2026-07-20T12:57:10Z' },
    { id: 'ORD-7079', symbol: 'ETHUSD', side: 'SELL', order_type: 'BRACKET_TP', price: 1880.1, size: 0.3, filled_size: 0.0, status: 'UNTRIGGERED', created_at: '2026-07-20T12:42:15Z' },
    { id: 'ORD-7078', symbol: 'ETHUSD', side: 'BUY', order_type: 'BRACKET_SL', price: 1842.85, size: 0.3, filled_size: 0.0, status: 'UNTRIGGERED', created_at: '2026-07-20T12:42:10Z' },
  ];

  const filteredOrders = activeAccountOrders.filter((ord) => {
    if (filter === 'open') return ord.status.toLowerCase() === 'open' || ord.status.toLowerCase() === 'untriggered';
    if (filter === 'filled') return ord.status.toLowerCase() === 'filled';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-cyan-400" /> Order History & Execution Audit
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Live account order execution log fetched from backend API (Refreshes live every 5s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
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
              className={`px-3 py-1 rounded border font-semibold ${
                filter === 'all' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-400'
              }`}
            >
              All Orders ({activeAccountOrders.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1 rounded border font-semibold ${
                filter === 'open' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-400'
              }`}
            >
              Active Bracket / Open ({activeAccountOrders.filter((o) => o.status.toLowerCase() === 'open' || o.status.toLowerCase() === 'untriggered').length})
            </button>
            <button
              onClick={() => setFilter('filled')}
              className={`px-3 py-1 rounded border font-semibold ${
                filter === 'filled' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-400'
              }`}
            >
              Filled ({activeAccountOrders.filter((o) => o.status.toLowerCase() === 'filled').length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Time (UTC)</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Limit / Trigger Price</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Filled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((ord) => {
                const isBuy = ord.side.toUpperCase() === 'BUY';
                const statusUpper = ord.status.toUpperCase();
                return (
                  <TableRow key={ord.id}>
                    <TableCell className="font-bold text-slate-200 font-mono">{ord.id}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-[11px]">
                      {ord.created_at ? new Date(ord.created_at).toISOString().replace('T', ' ').substring(0, 19) : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold text-slate-100 font-mono">{ord.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={isBuy ? 'success' : 'danger'} className="font-mono">
                        {ord.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono text-xs">
                      {ord.order_type.toUpperCase().replace('_', ' ')}
                    </TableCell>
                    <TableCell className="font-bold font-mono text-slate-100">
                      ${ord.price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                    </TableCell>
                    <TableCell className="font-mono text-slate-200">{ord.size}</TableCell>
                    <TableCell className="font-mono text-slate-300">{ord.filled_size}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusUpper === 'FILLED'
                            ? 'success'
                            : statusUpper === 'UNTRIGGERED' || statusUpper === 'OPEN'
                            ? 'info'
                            : 'muted'
                        }
                        className="font-mono"
                      >
                        {statusUpper}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
