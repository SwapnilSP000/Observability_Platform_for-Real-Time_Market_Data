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
  services: Record<string, {
    status: string;
    port?: number;
    url?: string;
    responseTime?: number;
    error?: string;
    reconnectAttempts?: number;
  }>;
  summary?: {
    operational: number;
    total: number;
    percentage: number;
  };
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
  change24h: number | null;
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
  const { data } = await apiClient.get<GrafanaDashboardItem[]>('/observability/dashboards');
  return data;
};

export const fetchTelemetryHealth = async (): Promise<TelemetryHealthData> => {
  const { data } = await apiClient.get<TelemetryHealthData>('/observability/health');
  return data;
};

export interface AssetHolding {
  asset: string;
  totalBalance: number;
  availableBalance: number;
  inOrders: number;
  usdValue: number;
  allocationPercent: number;
}

export interface PortfolioResponse {
  totalEquity: number;
  availableMargin: number;
  usedMargin: number;
  unrealizedPnl: number;
  assets: AssetHolding[];
}

export const fetchPortfolioSummary = async (): Promise<PortfolioResponse> => {
  const { data } = await apiClient.get<PortfolioResponse>('/api/v1/portfolio');
  return data;
};

export interface PositionItem {
  id: string;
  symbol: string;
  entryPrice: number;
  currentSize: number;
  margin: number;
  leverage: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export const fetchPositions = async (): Promise<PositionItem[]> => {
  const { data } = await apiClient.get<PositionItem[]>('/api/v1/portfolio/positions');
  return Array.isArray(data) ? data : [];
};

export interface OrderItem {
  id: string;
  external_order_id?: string;
  symbol: string;
  side: string;
  order_type: string;
  price: number;
  size: number;
  filled_size: number;
  status: string;
  created_at: string;
}

export const fetchOrders = async (): Promise<OrderItem[]> => {
  const { data } = await apiClient.get<OrderItem[]>('/api/v1/orders');
  return data;
};

export const fetchLokiLogs = async (query: string = '{app="backend"}'): Promise<any[]> => {
  const { data } = await apiClient.get<any[]>('/observability/logs', { params: { query } });
  return data;
};

export const fetchJaegerTraces = async (service: string = 'backend'): Promise<any[]> => {
  const { data } = await apiClient.get<any[]>('/observability/traces', { params: { service } });
  return data;
};

export const fetchPrometheusMetric = async (query: string = 'http_requests_total'): Promise<any> => {
  const { data } = await apiClient.get<any>('/observability/query-metric', { params: { query } });
  return data;
};
