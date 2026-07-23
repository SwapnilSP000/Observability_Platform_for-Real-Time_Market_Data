/**
 * Portfolio.tsx — Account equity, margin, positions overview.
 * All values sourced from live /api/v1/portfolio endpoint.
 * Zero hardcoded financial numbers. Math is wrapped in safe utilities.
 */
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Activity,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { usePortfolio, usePositions, useMarketTickers } from '../hooks/useMarketData';
import { formatUSD, formatPercent, safeNum, safeDivide, calcROE, riskLevel, formatPrice } from '../utils/financial';

// ── Risk Badge ────────────────────────────────────────────────────────────────
type RiskLevel = 'healthy' | 'warning' | 'critical' | 'none';

const RiskBadge: React.FC<{ level: RiskLevel; pct: string }> = ({ level, pct }) => {
  const configs: Record<RiskLevel, { label: string; Icon: React.ElementType; cls: string }> = {
    healthy: { label: 'HEALTHY', Icon: ShieldCheck, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
    warning: { label: 'WARNING', Icon: ShieldAlert, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
    critical: { label: 'CRITICAL', Icon: ShieldX, cls: 'text-rose-400 bg-rose-500/10 border-rose-500/25' },
    none: { label: 'N/A', Icon: AlertTriangle, cls: 'text-slate-400 bg-slate-800 border-slate-700' },
  };
  const { label, Icon, cls } = configs[level];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${cls}`}>
      <Icon className="w-3 h-3" />
      {label} {level !== 'none' && `· ${pct}`}
    </span>
  );
};

// ── Margin Usage Bar ──────────────────────────────────────────────────────────
const MarginBar: React.FC<{ usedPct: number }> = ({ usedPct }) => {
  const capped = Math.min(Math.max(usedPct, 0), 100);
  const color =
    capped >= 75 ? 'bg-rose-500' : capped >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-full h-1.5 bg-obsidian-700 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const Portfolio: React.FC = () => {
  const {
    data: portfolio,
    isLoading: isLoadingPortfolio,
    isError: isPortfolioError,
    dataUpdatedAt,
    refetch,
  } = usePortfolio();
  const { data: positionsData = [], isLoading: isLoadingPositions } = usePositions();
  const { data: tickersData } = useMarketTickers();
  const [countdown, setCountdown] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 1 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe computed values
  const totalEquity = safeNum(portfolio?.totalEquity);
  const availableMargin = safeNum(portfolio?.availableMargin);
  const usedMargin = safeNum(portfolio?.usedMargin);
  const unrealizedPnl = safeNum(portfolio?.unrealizedPnl);
  const assets = portfolio?.assets ?? [];

  const isProfitable = unrealizedPnl >= 0;
  const pnlPercent = formatPercent(safeDivide(unrealizedPnl, usedMargin) * 100, 2, true);
  const freePercent = formatPercent(safeDivide(availableMargin, totalEquity) * 100, 1);
  const usedPercent = safeDivide(usedMargin, totalEquity) * 100;
  const risk = riskLevel(usedMargin, totalEquity);

  const lastSyncTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour12: false })
    : '—';

  // Look up mark prices for positions
  const tickers = tickersData?.tickers ?? [];
  const markPriceOf = (symbol: string): number | null =>
    tickers.find((t) => t.symbol === symbol)?.markPrice ?? null;

  return (
    <div className="space-y-6">
      {/* ── Header Bar ── */}
      <div className="p-4 glass-card rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
            <Briefcase className="w-5 h-5 text-blue-400" /> Account Portfolio &amp; Asset Allocation
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Authenticated margin balances, unrealized equity &amp; collateral — live from Delta Exchange
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-800 border border-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync: {lastSyncTime}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-800 border border-slate-700 text-slate-300">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Next: {countdown}s</span>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors"
            title="Force Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error State ── */}
      {isPortfolioError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center gap-3 text-sm font-mono">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="text-rose-300 font-semibold">Portfolio API Error</p>
            <p className="text-rose-400/70 text-xs mt-0.5">
              Could not fetch portfolio data from /api/v1/portfolio. Verify backend connectivity.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <Card hover>
          <p className="text-xs text-slate-400 font-mono flex justify-between items-center">
            <span>TOTAL EQUITY</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          {isLoadingPortfolio ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-100 font-mono tabular-nums tracking-tight mt-1">
              {formatUSD(totalEquity)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs flex items-center font-mono tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {pnlPercent}
            </span>
            <span className="text-xs text-slate-500 font-mono">Position Return</span>
          </div>
        </Card>

        {/* Available Margin */}
        <Card hover>
          <p className="text-xs text-slate-400 font-mono flex justify-between items-center">
            <span>AVAILABLE MARGIN</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          {isLoadingPortfolio ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums tracking-tight mt-1">
              {formatUSD(availableMargin)}
            </p>
          )}
          <span className="text-xs text-slate-500 mt-2 block font-mono">{freePercent} Free Capital</span>
        </Card>

        {/* Used Margin */}
        <Card hover>
          <p className="text-xs text-slate-400 font-mono flex justify-between items-center">
            <span>USED MARGIN</span>
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
          </p>
          {isLoadingPortfolio ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-blue-400 font-mono tabular-nums tracking-tight mt-1">
              {formatUSD(usedMargin)}
            </p>
          )}
          <MarginBar usedPct={usedPercent} />
          <div className="mt-1.5">
            <RiskBadge level={risk} pct={`${usedPercent.toFixed(1)}%`} />
          </div>
        </Card>

        {/* Unrealized PnL */}
        <Card hover>
          <p className="text-xs text-slate-400 font-mono flex justify-between items-center">
            <span>UNREALIZED PNL</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </p>
          {isLoadingPortfolio ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className={`text-2xl font-bold font-mono tabular-nums tracking-tight mt-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? '+' : '-'}{formatUSD(Math.abs(unrealizedPnl))}
            </p>
          )}
          <span className="text-xs text-slate-400 mt-2 block font-mono">
            {isLoadingPositions ? '…' : positionsData.length} Active Positions
          </span>
        </Card>
      </div>

      {/* ── Open Positions Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Open Positions
            </span>
            <Badge variant={positionsData.length > 0 ? 'success' : 'muted'}>
              {positionsData.length} Positions
            </Badge>
          </CardTitle>
        </CardHeader>
        {isLoadingPositions ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : positionsData.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No active positions</p>
            <p className="text-xs text-slate-500">Submit an order to open a position on Delta Exchange.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Mark Price</TableHead>
                <TableHead>Liq Distance</TableHead>
                <TableHead>Unrealized PnL</TableHead>
                <TableHead>ROE %</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsData.map((pos) => {
                const mark = markPriceOf(pos.symbol);
                const isLong = pos.currentSize > 0;
                const isPnlPos = pos.unrealizedPnl >= 0;
                const roe = calcROE(pos.unrealizedPnl, pos.margin);

                // Liquidation distance
                const liqRef = mark ?? pos.entryPrice;
                let liqDist = '—';
                if (liqRef > 0 && pos.liquidationPrice > 0) {
                  const dist = Math.abs(safeDivide(liqRef - pos.liquidationPrice, liqRef) * 100);
                  liqDist = `${dist.toFixed(2)}%`;
                }
                const liqIsClose = liqDist !== '—' && parseFloat(liqDist) < 5;

                return (
                  <TableRow key={pos.id}>
                    <TableCell className="font-bold text-slate-100">{pos.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={isLong ? 'success' : 'danger'}>
                        {isLong ? 'LONG' : 'SHORT'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">{pos.currentSize}</TableCell>
                    <TableCell className="font-mono tabular-nums tracking-tight">
                      {formatPrice(pos.entryPrice)}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums tracking-tight">
                      {mark !== null ? formatPrice(mark) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={liqIsClose ? 'danger' : 'muted'}>{liqDist}</Badge>
                    </TableCell>
                    <TableCell
                      className={`font-bold font-mono tabular-nums tracking-tight ${
                        isPnlPos ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPnlPos ? '+' : '-'}{formatUSD(Math.abs(pos.unrealizedPnl))}
                    </TableCell>
                    <TableCell
                      className={`font-mono tabular-nums tracking-tight font-semibold ${
                        isPnlPos ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {roe}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums tracking-tight text-slate-300">
                      {formatUSD(pos.margin)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Asset Holdings Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" /> Collateral &amp; Asset Holdings
            </span>
            <Badge variant="info">{assets.length} Assets</Badge>
          </CardTitle>
        </CardHeader>
        {isLoadingPortfolio ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No collateral asset holdings returned</p>
            <p className="text-xs text-slate-500">Authenticated wallet balance is empty or processing.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Total Balance</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>In Orders</TableHead>
                <TableHead>USD Value</TableHead>
                <TableHead>Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((item) => (
                <TableRow key={item.asset}>
                  <TableCell className="font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {item.asset === 'BTC' ? '₿' : item.asset === 'ETH' ? 'Ξ' : '₮'}
                    </span>
                    <span>{item.asset}</span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{item.totalBalance.toLocaleString()} {item.asset}</TableCell>
                  <TableCell className="text-emerald-400 font-mono tabular-nums">{item.availableBalance.toLocaleString()} {item.asset}</TableCell>
                  <TableCell className="font-mono tabular-nums">{item.inOrders.toLocaleString()} {item.asset}</TableCell>
                  <TableCell className="font-bold font-mono tabular-nums tracking-tight">{formatUSD(item.usdValue)}</TableCell>
                  <TableCell>
                    <Badge variant="info">{item.allocationPercent}%</Badge>
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
