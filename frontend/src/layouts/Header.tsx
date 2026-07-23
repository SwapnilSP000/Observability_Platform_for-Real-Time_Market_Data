import React from 'react';
import { Search, Bell, RefreshCw, TrendingUp, TrendingDown, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { useMarketTickers } from '../hooks/useMarketData';
import { useTickerFlash, flashClass } from '../hooks/useTickerFlash';
import { formatPrice, safeNum } from '../utils/financial';
import { cn } from '../utils/cn';

// ─ Ticker chip ────────────────────────────────────────────────────────────────
const MiniTicker: React.FC<{ label: string; price: number | null; change: number | null; accent: string }> = ({
  label, price, change, accent,
}) => {
  const flash = useTickerFlash(price);
  const chg   = safeNum(change);
  const isPos = chg >= 0;
  return (
    <div className="hidden md:flex items-center gap-2 px-3 h-full border-r border-white/10 text-xs font-mono">
      <span className="font-semibold" style={{ color: accent }}>{label}</span>
      <span className={cn(
        'font-bold tabular-nums transition-colors duration-150',
        flash === 'up' ? 'text-ok' : flash === 'down' ? 'text-crit' : 'text-white'
      )}>
        {price !== null ? formatPrice(price) : '—'}
      </span>
      {price !== null && (
        <span className={cn('flex items-center gap-0.5 text-xs', isPos ? 'text-ok' : 'text-crit')}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPos ? '+' : ''}{chg.toFixed(2)}%
        </span>
      )}
    </div>
  );
};

// ─ Status chip ────────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ up: boolean; label: string }> = ({ up, label }) => (
  <div className="hidden lg:flex items-center gap-1.5 px-3 h-full border-r border-white/10 text-xs font-mono">
    <span className={cn('w-2 h-2 rounded-full', up ? 'bg-ok animate-pulse2' : 'bg-crit')} />
    <span className={up ? 'text-ok' : 'text-crit'}>{label}</span>
  </div>
);

// ─ Header ─────────────────────────────────────────────────────────────────────
export const Header: React.FC = () => {
  const { data: statusData, isLoading, refetch } = useSystemStatus();
  const { data: tickersData } = useMarketTickers();

  const tickers     = tickersData?.tickers ?? [];
  const isHealthy   = statusData?.status === 'operational' || statusData?.status === 'healthy';
  const deltaOk     = statusData?.exchangeConnectivity?.deltaExchange?.reachable ?? false;
  const wsConnected = statusData?.webSocketState?.connected ?? false;

  const btc = tickers.find((t) => t.symbol === 'BTC-PERP' || t.symbol === 'BTCUSD')
    ?? tickers.find((t) => t.symbol.includes('BTC') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'))
    ?? null;
  const eth = tickers.find((t) => t.symbol === 'ETH-PERP' || t.symbol === 'ETHUSD')
    ?? tickers.find((t) => t.symbol.includes('ETH') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'))
    ?? null;
  const sol = tickers.find((t) => t.symbol === 'SOL-PERP' || t.symbol === 'SOLUSD')
    ?? tickers.find((t) => t.symbol.includes('SOL') && !t.symbol.startsWith('C-') && !t.symbol.startsWith('P-'))
    ?? null;

  return (
    <header className="h-14 bg-ink flex items-stretch justify-between shrink-0 z-20 shadow-md">
      {/* Brand label */}
      <div className="flex items-center px-4 border-r border-white/10 gap-2">
        <span className="text-white font-bold text-sm tracking-tight hidden lg:block">DeltaOps</span>
        <span className="text-brand-400 text-xs font-mono hidden lg:block">v2</span>
      </div>

      {/* Search */}
      <div className="flex items-center flex-1 px-4 max-w-xs">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search symbols, metrics…"
            className="w-full bg-white/6 border border-white/10 rounded-sm text-xs text-white placeholder-white/30
                       pl-8 pr-3 py-1.5 focus:outline-none focus:border-brand-500/60 transition-all"
          />
        </div>
      </div>

      {/* Live tickers */}
      <MiniTicker label="BTC" price={btc?.markPrice ?? null} change={btc?.change24h ?? null} accent="#F59E0B" />
      <MiniTicker label="ETH" price={eth?.markPrice ?? null} change={eth?.change24h ?? null} accent="#818CF8" />
      <MiniTicker label="SOL" price={sol?.markPrice ?? null} change={sol?.change24h ?? null} accent="#34D399" />

      {/* Status pills */}
      <StatusPill up={isHealthy} label={isHealthy ? 'API Healthy' : 'API Degraded'} />
      <StatusPill up={deltaOk}   label={deltaOk   ? 'Delta Live'  : 'Delta Offline'} />

      {/* WS state */}
      <div className="hidden xl:flex items-center gap-1.5 px-3 h-full border-r border-white/10 text-xs font-mono">
        <span className={cn('w-2 h-2 rounded-full', wsConnected ? 'bg-ok animate-pulse2' : 'bg-warn-DEFAULT')} />
        <span className={wsConnected ? 'text-ok' : 'text-warn-text'}>
          WS {wsConnected ? 'LIVE' : 'RECONNECTING'}
        </span>
      </div>

      {/* Right icons */}
      <div className="flex items-stretch">
        <button onClick={() => refetch()}
          className="px-3 flex items-center text-white/40 hover:text-white hover:bg-white/8 transition-colors border-r border-white/10"
          title="Refresh">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
        <button className="px-3 flex items-center text-white/40 hover:text-white hover:bg-white/8 transition-colors border-r border-white/10 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-3.5 right-2.5 w-1.5 h-1.5 bg-crit rounded-full" />
        </button>
        <button className="px-3 flex items-center text-white/40 hover:text-white hover:bg-white/8 transition-colors border-r border-white/10">
          <Settings className="w-4 h-4" />
        </button>
        <button className="px-3 flex items-center text-white/40 hover:text-white hover:bg-white/8 transition-colors border-r border-white/10">
          <HelpCircle className="w-4 h-4" />
        </button>
        {/* User */}
        <button className="flex items-center gap-2 px-4 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-blue flex items-center justify-center text-xs font-bold text-white">
            SRE
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-white leading-none">DevOps Eng.</p>
            <p className="text-xs text-brand-400 leading-none mt-0.5">SRE Ops</p>
          </div>
          <ChevronDown className="w-3 h-3 text-white/30" />
        </button>
      </div>
    </header>
  );
};
