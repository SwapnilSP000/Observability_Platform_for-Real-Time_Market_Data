import { apiClient } from './client';

export interface HealthData {
  status: string;
  appName: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface StatusData {
  status: string;
  environment: string;
  exchangeConnectivity: {
    deltaExchange: {
      restUrl: string;
      wsUrl: string;
      apiKeyConfigured: boolean;
      maskedApiKey: string;
      reachable: boolean;
    };
  };
  webSocketState: {
    connected: boolean;
    wsUrl?: string;
    activeSubscriptions: string[];
    reconnectAttempts: number;
  };
  timestamp: string;
}

export interface GrafanaDashboardItem {
  uid: string;
  title: string;
  url: string;
  type: string;
}

export interface TelemetryHealthData {
  status: string;
  services: Record<string, { status: string; port?: number }>;
}

export interface MarketTicker {
  symbol: string;
  close: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  openInterest: number | null;
  markPrice: number | null;
  fundingRate: number | null;
}

export interface MarketListResponse {
  count: number;
  tickers: MarketTicker[];
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBookResponse {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp?: number;
}

export const fetchHealth = async (): Promise<HealthData> => {
  const { data } = await apiClient.get<HealthData>('/health');
  return data;
};

export const fetchStatus = async (): Promise<StatusData> => {
  const { data } = await apiClient.get<StatusData>('/status');
  return data;
};

export const fetchMarketTickers = async (): Promise<MarketListResponse> => {
  const { data } = await apiClient.get<MarketListResponse>('/api/v1/market/tickers');
  return data;
};

export const fetchOrderBook = async (symbol: string): Promise<OrderBookResponse> => {
  const { data } = await apiClient.get<OrderBookResponse>(`/api/v1/market/orderbook/${symbol}`);
  return data;
};

export const fetchGrafanaDashboards = async (): Promise<GrafanaDashboardItem[]> => {
  const { data } = await apiClient.get<GrafanaDashboardItem[]>('/api/v1/observability/dashboards');
  return data;
};

export const fetchTelemetryHealth = async (): Promise<TelemetryHealthData> => {
  const { data } = await apiClient.get<TelemetryHealthData>('/api/v1/observability/health');
  return data;
};
