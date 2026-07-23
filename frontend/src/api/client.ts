import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let latestLatencyMs: number | null = null;
let latestStatusCode: number | null = null;
let totalRequestsCount = 0;

export const getLatestApiMetrics = () => ({
  latencyMs: latestLatencyMs,
  statusCode: latestStatusCode,
  requestCount: totalRequestsCount,
});

/** Generate a W3C traceparent header value: 00-<traceId>-<spanId>-01 */
function generateTraceparent(): string {
  const traceId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const spanId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `00-${traceId}-${spanId}-01`;
}

// Request Interceptor: Attach start time, request ID, and W3C traceparent header
apiClient.interceptors.request.use(
  (config: any) => {
    const traceparent = generateTraceparent();
    config.headers['X-Request-ID'] = `req-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    config.headers['traceparent'] = traceparent;
    config.meta = { startTime: performance.now(), traceparent };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Record exact measured latency, status, and log trace info
apiClient.interceptors.response.use(
  (response: any) => {
    totalRequestsCount += 1;
    if (response.config?.meta?.startTime) {
      latestLatencyMs = Math.round(performance.now() - response.config.meta.startTime);
    }
    latestStatusCode = response.status;
    return response;
  },
  (error) => {
    totalRequestsCount += 1;
    if (error.config?.meta?.startTime) {
      latestLatencyMs = Math.round(performance.now() - error.config.meta.startTime);
    }
    latestStatusCode = error.response?.status ?? 0;
    const errorMsg =
      error.response?.data?.detail ||
      error.response?.data?.error?.message ||
      error.message ||
      'Network error';
    const traceparent = error.config?.meta?.traceparent ?? 'none';
    console.error(`[API Error] ${errorMsg} | status=${latestStatusCode} | traceparent=${traceparent}`);
    return Promise.reject(new Error(errorMsg));
  }
);

