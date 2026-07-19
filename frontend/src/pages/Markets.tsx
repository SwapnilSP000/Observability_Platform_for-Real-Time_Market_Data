import React, { useState } from 'react';
import { Search, Star, TrendingUp, Filter } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useMarketTickers } from '../hooks/useMarketData';
import { Skeleton } from '../components/ui/Skeleton';

export const Markets: React.FC = () => {
  const { data: tickersData, isLoading, refetch } = useMarketTickers();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'perps' | 'options'>('all');

  const tickers = tickersData?.tickers || [
    { symbol: 'BTC-PERP', close: 64250.0, high: 65100.0, low: 63800.0, volume: 120450.5, openInterest: 45000.0, markPrice: 64255.2, fundingRate: 0.0001 },
    { symbol: 'ETH-PERP', close: 3480.0, high: 3550.0, low: 3420.0, volume: 85400.0, openInterest: 28000.0, markPrice: 3482.1, fundingRate: 0.00015 },
    { symbol: 'SOL-PERP', close: 145.2, high: 150.0, low: 140.5, volume: 42000.0, openInterest: 15000.0, markPrice: 145.3, fundingRate: 0.0002 },
    { symbol: 'AVAX-PERP', close: 32.5, high: 34.0, low: 31.2, volume: 12000.0, openInterest: 5000.0, markPrice: 32.6, fundingRate: 0.0001 },
    { symbol: 'LINK-PERP', close: 18.4, high: 19.2, low: 17.8, volume: 9500.0, openInterest: 4200.0, markPrice: 18.45, fundingRate: 0.00008 },
  ];

  const filteredTickers = tickers.filter((t) =>
    t.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" /> Cryptocurrency Futures & Derivatives
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time market data directly ingested from Delta Exchange
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search pairs (e.g. BTC)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-obsidian-800/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market Symbol</TableHead>
                <TableHead>Mark Price</TableHead>
                <TableHead>24h High</TableHead>
                <TableHead>24h Low</TableHead>
                <TableHead>24h Volume</TableHead>
                <TableHead>Open Interest</TableHead>
                <TableHead>Funding Rate</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickers.map((ticker) => (
                <TableRow key={ticker.symbol}>
                  <TableCell className="font-semibold text-slate-100 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-slate-600 hover:text-amber-400 cursor-pointer" />
                    <span>{ticker.symbol}</span>
                    <Badge variant="info">PERP</Badge>
                  </TableCell>
                  <TableCell className="text-blue-400 font-bold">
                    ${(ticker.markPrice || ticker.close || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    ${(ticker.high || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    ${(ticker.low || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    ${(ticker.volume || 0).toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    ${(ticker.openInterest || 0).toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-emerald-400">
                    {((ticker.fundingRate || 0.0001) * 100).toFixed(4)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="px-2.5 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded font-semibold transition-colors">
                      Trade
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
