import React, { useState, useMemo } from 'react';
import { Search, Star, TrendingUp, TrendingDown, Filter, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, StatCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Sparkline } from '../components/ui/Sparkline';
import { useMarketTickers } from '../hooks/useMarketData';
import { formatPrice, formatVolume, safeNum } from '../utils/financial';
import { cn } from '../utils/cn';
import { MarketTicker } from '../api/services';

// ─ Mini ticker change indicator ───────────────────────────────────────────────
const Change: React.FC<{ val: number }> = ({ val }) => {
  const isPos = val >= 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-semibold font-mono text-xs', isPos ? 'text-ok' : 'text-crit')}>
      {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPos ? '+' : ''}{val.toFixed(2)}%
    </span>
  );
};

// ─ Row sparkline: deterministic from price seed ────────────────────────────────
const rowSpark = (price: number) =>
  Array.from({ length: 16 }, (_, i) => price + Math.sin(i * 0.5 + price) * price * 0.012);

export const Markets: React.FC = () => {
  const { data: tickersData, isLoading, refetch } = useMarketTickers();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'symbol' | 'change' | 'volume'>('volume');

  const tickers: MarketTicker[] = tickersData?.tickers ?? [];

  const filtered = useMemo(() => {
    let rows = tickers.filter((t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase())
    );
    if (sortKey === 'change') rows = rows.sort((a, b) => safeNum(b.change24h) - safeNum(a.change24h));
    if (sortKey === 'volume') rows = rows.sort((a, b) => safeNum(b.volume) - safeNum(a.volume));
    if (sortKey === 'symbol') rows = rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return rows;
  }, [tickers, search, sortKey]);

  const gainers = tickers.filter((t) => safeNum(t.change24h) > 0).length;
  const losers  = tickers.filter((t) => safeNum(t.change24h) < 0).length;
  const bigGain = tickers.reduce((mx, t) => safeNum(t.change24h) > safeNum(mx.change24h) ? t : mx, tickers[0] ?? {} as any);
  const bigLoss = tickers.reduce((mn, t) => safeNum(t.change24h) < safeNum(mn.change24h) ? t : mn, tickers[0] ?? {} as any);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-ok" /> Crypto Futures Markets
          </h1>
          <p className="text-xs text-ink-2 font-mono mt-1">Live data from Delta Exchange</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              type="text" placeholder="Search symbols…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 pr-3 py-1.5 text-xs w-44"
            />
          </div>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {!isLoading && tickers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Symbols" accent="blue"  value={tickers.length} icon={<Filter className="w-4 h-4" />} />
          <StatCard label="Gainers"       accent="green" value={gainers}        icon={<TrendingUp className="w-4 h-4" />} sub="↑ positive 24h" />
          <StatCard label="Losers"        accent="red"   value={losers}         icon={<TrendingDown className="w-4 h-4" />} sub="↓ negative 24h" />
          <StatCard label="Top Gainer"    accent="teal"
            value={bigGain?.symbol ? `+${safeNum(bigGain.change24h).toFixed(1)}%` : '—'}
            sub={bigGain?.symbol ?? '—'} />
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-2">Sort by:</span>
        {(['volume', 'change', 'symbol'] as const).map((k) => (
          <button key={k} onClick={() => setSortKey(k)}
            className={cn(
              'px-2.5 py-1 rounded border text-xs font-semibold transition-colors',
              sortKey === k ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'
            )}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-ink-3 font-mono">{filtered.length} symbols</span>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Connecting to Delta Exchange…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised border-b border-divider">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-2 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider">Mark Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider">24h Change</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider hidden md:table-cell">24h High</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider hidden md:table-cell">24h Low</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider hidden lg:table-cell">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider hidden xl:table-cell">Funding</th>
                  <th className="px-3 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider hidden lg:table-cell w-28">7d</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-2 uppercase tracking-wider">Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((ticker) => {
                  const chg    = safeNum(ticker.change24h);
                  const isPos  = chg >= 0;
                  const price  = ticker.markPrice || ticker.close || 0;
                  const spark  = rowSpark(price);
                  const fundR  = safeNum(ticker.fundingRate ?? 0.0001) * 100;
                  return (
                    <tr key={ticker.symbol} className="hover:bg-brand-50 transition-colors duration-75">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-ink-3 hover:text-warn-DEFAULT cursor-pointer transition-colors" />
                          <span className="font-semibold text-ink">{ticker.symbol}</span>
                          <Badge variant="blue" className="text-xs">PERP</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: '#0073E6' }}>
                        {formatPrice(price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Change val={chg} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-2 hidden md:table-cell">
                        {formatPrice(ticker.high)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-2 hidden md:table-cell">
                        {formatPrice(ticker.low)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-2 hidden lg:table-cell">
                        {formatVolume(ticker.volume)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden xl:table-cell">
                        <span className={fundR >= 0 ? 'text-ok' : 'text-crit'}>
                          {fundR >= 0 ? '+' : ''}{fundR.toFixed(4)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell w-28">
                        <Sparkline data={spark} color={isPos ? '#0D8A4E' : '#D93025'} height={32} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="px-3 py-1 text-xs font-semibold rounded bg-gradient-blue text-white hover:opacity-90 transition-opacity">
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
