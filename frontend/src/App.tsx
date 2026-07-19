import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { TradingTerminal } from './pages/TradingTerminal';
import { Portfolio } from './pages/Portfolio';
import { Orders } from './pages/Orders';
import { Analytics } from './pages/Analytics';
import { Observability } from './pages/Observability';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="markets" element={<Markets />} />
            <Route path="trading" element={<TradingTerminal />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="orders" element={<Orders />} />
            <Route path="positions" element={<TradingTerminal />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="observability" element={<Navigate to="/observability/metrics" replace />} />
            <Route path="observability/:tab" element={<Observability />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Settings />} />
            <Route path="help" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
