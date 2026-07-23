import React, { useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useOrderBook, useMarketTickers, usePortfolio, usePositions, useOrders } from '../hooks/useMarketData';
import { getLatestApiMetrics } from '../api/client';
import { formatUSD, formatPercent, safeNum, safeDivide, calcROE, calcLiqDistance, formatPrice } from '../utils/financial';

export const TradingTerminal: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-PERP');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('sell');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [activeBottomTab, setActiveBottomTab] = useState('positions');
  const [quantity, setQuantity] = useState('0.005');

  const { data: orderBookData, isLoading: isLoadingOrderBook } = useOrderBook(selectedSymbol);
  const { data: tickersData, isLoading: isLoadingTickers } = useMarketTickers();
  const { data: portfolioData } = usePortfolio();
  const { data: positionsData = [], isLoading: isLoadingPositions } = usePositions();
  const { data: ordersData = [], isLoading: isLoadingOrders } = useOrders();

  const tickers = tickersData?.tickers || [];

  const btcTicker = tickers.find((t) => (t.symbol === 'BTCUSD' || t.symbol === 'BTC-PERP') && t.markPrice && t.markPrice > 1000.0)
    || tickers.find((t) => t.symbol === 'BTCUSD' || t.symbol === 'BTC-PERP');

  const ethTicker = tickers.find((t) => (t.symbol === 'ETHUSD' || t.symbol === 'ETH-PERP') && t.markPrice && t.markPrice > 100.0)
    || tickers.find((t) => t.symbol === 'ETHUSD' || t.symbol === 'ETH-PERP');

  const currentTicker = selectedSymbol.includes('ETH') ? ethTicker : btcTicker;
  const markPrice = currentTicker?.markPrice || currentTicker?.close || 0;
  const highPrice = currentTicker?.high || 0;
  const lowPrice = currentTicker?.low || 0;
  const volume24h = currentTicker?.volume ? `$${(currentTicker.volume / 1_000_000).toFixed(1)}M` : '—';

  const bids = orderBookData?.bids.slice(0, 10) || [];
  const asks = orderBookData?.asks.slice(0, 10) || [];

  const topBid = bids.length > 0 ? bids[0].price : markPrice > 0 ? markPrice - 0.5 : 0;
  const topAsk = asks.length > 0 ? asks[0].price : markPrice > 0 ? markPrice + 0.5 : 0;
  const spread = topAsk > 0 && topBid > 0 ? (topAsk - topBid).toFixed(1) : '0.0';
  const spreadPct = topAsk > 0 && topBid > 0 ? (((topAsk - topBid) / topAsk) * 100).toFixed(3) : '0.000';

  const availableMargin = portfolioData?.availableMargin ?? 0;
  const activeOrders = ordersData.filter((o) => o.status.toLowerCase() === 'open');

  const stopOrders = ordersData.filter(
    (o) => o.order_type?.toLowerCase().includes('stop') || o.order_type?.toLowerCase().includes('bracket')
  );

  return (
    <div className="space-y-4">
      {/* Symbol & Operational Diagnostics Header Bar */}
      <div className="p-3 glass-card rounded-lg flex flex-wrap items-center justify-between font-mono text-xs gap-3 border border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-obsidian-800 text-slate-100 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="BTC-PERP">BTCUSD (Bitcoin Perp)</option>
            <option value="ETH-PERP">ETHUSD (Ethereum Perp)</option>
            <option value="SOL-PERP">SOLUSD (Solana Perp)</option>
            <option value="AVAX-PERP">AVAXUSD (Avalanche Perp)</option>
          </select>
          <Badge variant="info">25x LEVERAGE</Badge>
          <div>
            <span className="text-slate-500">MARK PRICE: </span>
            {isLoadingTickers ? (
              <Skeleton className="inline-block h-4 w-16 align-middle" />
            ) : (
              <span className="text-emerald-400 font-bold">${markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          <div>
            <span className="text-slate-500">BEST BID / ASK: </span>
            <span className="text-emerald-400 font-semibold">${topBid.toFixed(1)}</span> / <span className="text-rose-400 font-semibold">${topAsk.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-slate-500">24H HIGH: </span>
            <span className="text-slate-200">${highPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-slate-500">24H LOW: </span>
            <span className="text-slate-200">${lowPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-slate-500">24H VOL: </span>
            <span className="text-blue-400">{volume24h}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const metrics = getLatestApiMetrics();
            return (
              <>
                {metrics.statusCode && (
                  <Badge variant={metrics.statusCode === 200 ? 'success' : 'danger'}>
                    HTTP {metrics.statusCode}
                  </Badge>
                )}
                {metrics.latencyMs !== null && (
                  <Badge variant="info">
                    {metrics.latencyMs}ms Latency
                  </Badge>
                )}
              </>
            );
          })()}
          <span className="text-slate-500 text-[11px]">Sync: Live 1s</span>
        </div>
      </div>

      {/* Main Terminal Layout: Orderbook (6 Cols) + Order Form (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* L2 Orderbook Depth (6 Cols) */}
        <div className="lg:col-span-6">
          <Card className="h-[460px] flex flex-col font-mono text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Live L2 Order Book ({selectedSymbol})
                </span>
                <span className="text-[11px] font-normal text-slate-400">Refreshes every 1s</span>
              </CardTitle>
            </CardHeader>
            <div className="flex justify-between text-[11px] text-slate-500 py-1 px-2 border-b border-slate-800">
              <span>PRICE (USD)</span>
              <span>SIZE ({selectedSymbol.split('-')[0]})</span>
            </div>

            {/* Asks (Sells) */}
            <div className="flex-1 overflow-y-auto space-y-0.5 py-1 px-1">
              {isLoadingOrderBook ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                asks.slice().reverse().map((ask, idx) => (
                  <div key={idx} className="flex justify-between items-center text-rose-400 hover:bg-rose-500/10 px-2 py-0.5 rounded text-[11px]">
                    <span>{ask.price.toFixed(1)}</span>
                    <span>{ask.size.toFixed(3)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Spread Divider */}
            <div className="py-2 px-3 my-1 bg-obsidian-800/90 rounded flex justify-between items-center text-slate-100 font-bold border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">${markPrice.toLocaleString('en-US', { minimumFractionDigits: 1 })}</span>
              </div>
              <span className="text-[10px] text-slate-400">SPREAD {spread} ({spreadPct}%)</span>
            </div>

            {/* Bids (Buys) */}
            <div className="flex-1 overflow-y-auto space-y-0.5 py-1 px-1">
              {isLoadingOrderBook ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                bids.map((bid, idx) => (
                  <div key={idx} className="flex justify-between items-center text-emerald-400 hover:bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                    <span>{bid.price.toFixed(1)}</span>
                    <span>{bid.size.toFixed(3)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Buy / Sell Order Panel (6 Cols) */}
        <div className="lg:col-span-6">
          <Card className="h-[460px] flex flex-col justify-between">
            <div>
              {/* Buy / Sell Switch Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors ${
                    orderSide === 'buy' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-obsidian-800 text-slate-400'
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors ${
                    orderSide === 'sell' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-obsidian-800 text-slate-400'
                  }`}
                >
                  Sell / Short
                </button>
              </div>

              {/* Order Type Selector */}
              <div className="flex gap-2 mb-4 font-mono text-xs">
                <button
                  onClick={() => setOrderType('limit')}
                  className={`px-3 py-1 rounded border font-semibold ${
                    orderType === 'limit' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Limit
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`px-3 py-1 rounded border font-semibold ${
                    orderType === 'market' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Market
                </button>
              </div>

              {/* Input Form */}
              <div className="space-y-3 font-mono text-xs">
                {orderType === 'limit' && (
                  <div>
                    <label className="text-slate-400 mb-1 block">Limit Price (USD)</label>
                    <input
                      type="number"
                      defaultValue={markPrice > 0 ? markPrice.toFixed(1) : ''}
                      className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Contract Quantity ({selectedSymbol.split('-')[0]})</span>
                    <span>Avail: ${availableMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Percentage Quick Selector */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {['10%', '25%', '50%', '75%', '100%'].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setQuantity((parseFloat(pct) / 100).toFixed(3))}
                      className="py-1 rounded bg-obsidian-800 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
                    >
                      {pct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Execution Button & Margin Calculation */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Margin Required:</span>
                <span className="text-slate-100 font-bold">${((parseFloat(quantity) || 0.005) * markPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
              <Button
                variant={orderSide === 'buy' ? 'success' : 'danger'}
                className="w-full font-bold uppercase tracking-wider py-3"
              >
                Place {orderSide.toUpperCase()} Order
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Tabs: Positions, Open Orders, Stop Orders & History */}
      <Card>
        <Tabs
          tabs={[
            { id: 'positions', label: 'Open Positions', count: positionsData.length },
            { id: 'open-orders', label: 'Open Orders', count: activeOrders.length },
            { id: 'stop-orders', label: 'Stop Orders', count: stopOrders.length },
            { id: 'history', label: 'Order Execution Audit' },
          ]}
          activeTab={activeBottomTab}
          onTabChange={setActiveBottomTab}
        />
        <div className="p-4 text-xs font-mono text-slate-400">
          {activeBottomTab === 'positions' && (
            <div className="space-y-2.5">
              {isLoadingPositions ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : positionsData.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-400 font-semibold">No active positions</p>
                  <p className="text-[11px] text-slate-500">Submit an order to open a new position on Delta Exchange.</p>
                </div>
              ) : (
                positionsData.map((pos) => {
                  const isLong = pos.currentSize > 0;
                  const isProfitable = pos.unrealizedPnl >= 0;
                  const roe = calcROE(pos.unrealizedPnl, pos.margin);
                  
                  // Look up the specific mark price of this position's symbol rather than the dropdown's symbol
                  const posTicker = tickers.find((t) => t.symbol === pos.symbol);
                  const posMarkPrice = posTicker?.markPrice ?? posTicker?.close ?? pos.entryPrice;
                  
                  const liqDist = calcLiqDistance(posMarkPrice, pos.liquidationPrice);

                  return (
                    <div key={pos.id} className="flex flex-wrap items-center justify-between p-3 rounded bg-obsidian-800/50 border border-slate-800 gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={isLong ? 'success' : 'danger'}>{isLong ? 'LONG' : 'SHORT'}</Badge>
                        <span className="font-bold text-slate-100">{pos.symbol}</span>
                        <span className="font-mono tabular-col tracking-tight text-slate-300">Size: {pos.currentSize}</span>
                        <span className="font-mono tabular-col tracking-tight text-slate-300">Entry: {formatPrice(pos.entryPrice)}</span>
                        <span className="font-mono tabular-col tracking-tight text-slate-300">Margin: {formatUSD(pos.margin)}</span>
                        <span className="font-mono tabular-col tracking-tight text-slate-300">
                          Liq Price: {pos.liquidationPrice > 0 ? formatPrice(pos.liquidationPrice) : '—'}
                        </span>
                        <Badge variant={liqDist !== '—' && parseFloat(liqDist) < 5 ? 'danger' : 'info'}>
                          Liq Dist: {liqDist}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold font-mono tabular-col tracking-tight ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          UPNL: {isProfitable ? '+' : ''}{formatUSD(pos.unrealizedPnl)} ({roe})
                        </span>
                        <button className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-semibold hover:bg-rose-500/30 transition-colors">
                          Close Position
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeBottomTab === 'open-orders' && (
            <div className="space-y-2">
              {isLoadingOrders ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : activeOrders.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No active open limit orders.</p>
              ) : (
                activeOrders.map((ord) => (
                  <div key={ord.id} className="flex justify-between items-center p-2.5 rounded bg-obsidian-800/40 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge variant={ord.side.toUpperCase() === 'BUY' ? 'success' : 'danger'}>{ord.side}</Badge>
                      <span className="font-bold text-slate-100">{ord.symbol}</span>
                      <span>Price: ${ord.price.toLocaleString()}</span>
                      <span>Size: {ord.size}</span>
                    </div>
                    <Badge variant="muted">{ord.status}</Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'stop-orders' && (
            <div className="space-y-2">
              {isLoadingOrders ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : stopOrders.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No active stop or bracket orders found.</p>
              ) : (
                stopOrders.map((ord) => (
                  <div key={ord.id} className="flex justify-between items-center p-2.5 rounded bg-obsidian-800/40 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge variant={ord.side.toUpperCase() === 'BUY' ? 'success' : 'danger'}>{ord.symbol} {ord.order_type}</Badge>
                      <span>Trigger: ${ord.price.toLocaleString()}</span>
                      <span>Size: {ord.size}</span>
                    </div>
                    <Badge variant="muted">{ord.status}</Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'history' && (
            <div className="space-y-2">
              {isLoadingOrders ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : ordersData.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No historical order executions recorded.</p>
              ) : (
                ordersData.map((ord) => (
                  <div key={ord.id} className="p-2.5 rounded bg-obsidian-800/40 border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant={ord.status.toUpperCase() === 'FILLED' ? 'success' : 'muted'}>{ord.status}</Badge>
                      <span className="font-bold text-slate-100">{ord.symbol}</span>
                      <span>{ord.side} {ord.order_type}</span>
                      <span>Price: ${ord.price.toLocaleString()}</span>
                      <span>Size: {ord.size}</span>
                    </div>
                    <span className="text-slate-400">{ord.created_at?.substring(0, 19).replace('T', ' ')}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
