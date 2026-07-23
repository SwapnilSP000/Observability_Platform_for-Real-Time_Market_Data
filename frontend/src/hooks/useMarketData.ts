import { useQuery } from '@tanstack/react-query';
import {
  fetchMarketTickers,
  fetchOrderBook,
  fetchPortfolioSummary,
  fetchPositions,
  fetchOrders,
  fetchLokiLogs,
  fetchJaegerTraces,
  fetchPrometheusMetric,
  fetchGrafanaDashboards,
  fetchTelemetryHealth,
} from '../api/services';

export const useMarketTickers = () => {
  return useQuery({
    queryKey: ['market-tickers'],
    queryFn: fetchMarketTickers,
    refetchInterval: 1000,
    staleTime: 500,
  });
};

export const useOrderBook = (symbol: string) => {
  return useQuery({
    queryKey: ['orderbook', symbol],
    queryFn: () => fetchOrderBook(symbol),
    refetchInterval: 1000,
    staleTime: 500,
    enabled: Boolean(symbol),
  });
};

export const usePortfolio = () => {
  return useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: fetchPortfolioSummary,
    refetchInterval: 10000,
    staleTime: 8000,
  });
};

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions-list'],
    queryFn: fetchPositions,
    refetchInterval: 10000,
    staleTime: 8000,
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders-list'],
    queryFn: fetchOrders,
    refetchInterval: 10000,
    staleTime: 8000,
  });
};

export const useLokiLogs = (query?: string) => {
  return useQuery({
    queryKey: ['loki-logs', query],
    queryFn: () => fetchLokiLogs(query),
    refetchInterval: 5000,
    staleTime: 4000,
  });
};

export const useJaegerTraces = (service?: string) => {
  return useQuery({
    queryKey: ['jaeger-traces', service],
    queryFn: () => fetchJaegerTraces(service),
    refetchInterval: 5000,
    staleTime: 4000,
  });
};

export const usePrometheusMetric = (query?: string) => {
  return useQuery({
    queryKey: ['prometheus-metric', query],
    queryFn: () => fetchPrometheusMetric(query),
    refetchInterval: 5000,
    staleTime: 4000,
  });
};

export const useGrafanaDashboards = () => {
  return useQuery({
    queryKey: ['grafana-dashboards'],
    queryFn: fetchGrafanaDashboards,
    refetchInterval: 30000,
    staleTime: 25000,
  });
};

export const useTelemetryHealth = () => {
  return useQuery({
    queryKey: ['telemetry-health'],
    queryFn: fetchTelemetryHealth,
    refetchInterval: 5000,
    staleTime: 4000,
  });
};
