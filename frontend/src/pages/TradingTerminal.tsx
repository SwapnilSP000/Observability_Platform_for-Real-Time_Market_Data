import React, { useState } from 'react';
import {
  LineChart,
  ArrowUp,
  ArrowDown,
  Info,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { useOrderBook } from '../hooks/useMarketData';

export const TradingTerminal: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-PERP');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [activeBottomTab, setActiveBottomTab] = useState('positions');

  const { data: orderBookData } = useOrderBook(selectedSymbol);

  const bids = orderBookData?.bids.slice(0, 8) || [
    { price: 64250.0, size: 1.25 },
    { price: 64249.5, size: 0.84 },
    { price: 64249.0, size: 2.15 },
    { price: 64248.5, size: 0.45 },
    { price: 64248.0, size: 3.10 },
    { price: 64247.5, size: 1.05 },
    { price: 64247.0, size: 0.92 },
    { price: 64246.5, size: 4.50 },
  ];

  const asks = orderBookData?.asks.slice(0, 8) || [
    { price: 64255.0, size: 0.65 },
    { price: 64255.5, size: 1.40 },
    { price: 64256.0, size: 0.95 },
    { price: 64256.5, size: 2.80 },
    { price: 64257.0, size: 0.30 },
    { price: 64257.5, size: 1.85 },
    { price: 64258.0, size: 3.20 },
    { price: 64258.5, size: 0.75 },
  ];

  return (
    <div className="space-y-4">
      {/* Symbol Bar */}
      <div className="p-3 glass-card rounded-lg flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm text-slate-100">{selectedSymbol}</span>
          <Badge variant="info">25x LEVERAGE</Badge>
          <div>
            <span className="text-slate-500">MARK PRICE: </span>
            <span className="text-emerald-400 font-bold">$64,250.00</span>
          </div>
          <div>
            <span className="text-slate-500">24H CHANGE: </span>
            <span className="text-emerald-400">+4.25%</span>
          </div>
          <div>
            <span className="text-slate-500">FUNDING: </span>
            <span className="text-blue-400">0.0100% in 3h</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Layout: Chart + Orderbook + Order Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart Viewport (8 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="h-[480px] flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-blue-400" /> TradingView Chart (BTC-PERP 15m)
              </CardTitle>
              <div className="flex gap-1 text-[11px] font-mono">
                <button className="px-2 py-0.5 rounded bg-obsidian-700 text-blue-400 font-bold">15m</button>
                <button className="px-2 py-0.5 rounded text-slate-400 hover:text-slate-200">1h</button>
                <button className="px-2 py-0.5 rounded text-slate-400 hover:text-slate-200">4h</button>
                <button className="px-2 py-0.5 rounded text-slate-400 hover:text-slate-200">1D</button>
              </div>
            </CardHeader>

            {/* Candlestick Visualization Placeholder */}
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded bg-obsidian-950/40 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
              <Zap className="w-10 h-10 text-blue-500/40 mb-2" />
              <p className="text-xs text-slate-400 font-mono">Real-Time Lightweight Charts / TradingView Feed</p>
              <p className="text-[10px] text-slate-500 mt-1">Live WebSocket candles stream initialized</p>
            </div>
          </Card>
        </div>

        {/* L2 Orderbook Depth (3 Cols) */}
        <div className="lg:col-span-3">
          <Card className="h-[480px] flex flex-col font-mono text-xs">
            <CardHeader>
              <CardTitle>Order Book (L2)</CardTitle>
            </CardHeader>
            <div className="flex justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-800">
              <span>PRICE (USD)</span>
              <span>SIZE (BTC)</span>
            </div>

            {/* Asks (Sells) */}
            <div className="flex-1 overflow-y-auto space-y-1 py-1">
              {asks.slice().reverse().map((ask, idx) => (
                <div key={idx} className="flex justify-between items-center text-rose-400 hover:bg-rose-500/10 px-1 py-0.5 rounded">
                  <span>{ask.price.toFixed(1)}</span>
                  <span>{ask.size.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Spread Divider */}
            <div className="py-2 px-2 my-1 bg-obsidian-800/80 rounded flex justify-between items-center text-slate-200 font-bold border border-slate-800">
              <span className="text-emerald-400">$64,250.00</span>
              <span className="text-[10px] text-slate-500">SPREAD 5.0 (0.01%)</span>
            </div>

            {/* Bids (Buys) */}
            <div className="flex-1 overflow-y-auto space-y-1 py-1">
              {bids.map((bid, idx) => (
                <div key={idx} className="flex justify-between items-center text-emerald-400 hover:bg-emerald-500/10 px-1 py-0.5 rounded">
                  <span>{bid.price.toFixed(1)}</span>
                  <span>{bid.size.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Buy / Sell Order Panel (3 Cols) */}
        <div className="lg:col-span-3">
          <Card className="h-[480px] flex flex-col justify-between">
            <div>
              {/* Buy / Sell Switch Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`py-2 rounded font-bold text-xs uppercase transition-colors ${
                    orderSide === 'buy' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-obsidian-800 text-slate-400'
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`py-2 rounded font-bold text-xs uppercase transition-colors ${
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
                  className={`px-3 py-1 rounded border ${
                    orderType === 'limit' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Limit
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`px-3 py-1 rounded border ${
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
                      defaultValue="64250.0"
                      className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="text-slate-400 mb-1 block">Contract Quantity (BTC)</label>
                  <input
                    type="number"
                    placeholder="1.0"
                    className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Execution Button */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Margin Required:</span>
                <span className="text-slate-200">$2,570.00</span>
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

      {/* Bottom Tabs: Positions & Open Orders */}
      <Card>
        <Tabs
          tabs={[
            { id: 'positions', label: 'Open Positions', count: 1 },
            { id: 'open-orders', label: 'Open Orders', count: 0 },
            { id: 'history', label: 'Order History' },
          ]}
          activeTab={activeBottomTab}
          onTabChange={setActiveBottomTab}
        />
        <div className="p-4 text-xs font-mono text-slate-400">
          {activeBottomTab === 'positions' && (
            <div className="flex justify-between items-center p-3 rounded bg-obsidian-800/50 border border-slate-800">
              <div className="flex items-center gap-3">
                <Badge variant="success">LONG</Badge>
                <span className="font-bold text-slate-100">BTC-PERP</span>
                <span>Size: 1.50 BTC</span>
                <span>Entry: $62,500.00</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-bold">Unrealized PnL: +$2,625.00 (+4.2%)</span>
                <button className="px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">Close Position</button>
              </div>
            </div>
          )}
          {activeBottomTab === 'open-orders' && <p>No active open orders.</p>}
          {activeBottomTab === 'history' && <p>Order execution logs prepared.</p>}
        </div>
      </Card>
    </div>
  );
};
