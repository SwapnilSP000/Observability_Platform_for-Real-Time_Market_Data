# DeltaOps Backend — Structured Log Samples

These are real log lines emitted by the FastAPI backend (`docker compose logs backend`).
All lines are valid JSON as produced by `LokiJSONFormatter` in `backend/app/core/logging.py`.
Promtail extracts `level`, `service`, and `stream` as Loki stream labels.

---

## Startup Logs

```json
{"timestamp":"2024-01-15T10:00:01.042Z","level":"INFO","service":"main","event":"Starting DeltaOps Engine Service","environment":"production","version":"0.1.0-alpha","trace_id":"","span_id":""}
{"timestamp":"2024-01-15T10:00:01.118Z","level":"INFO","service":"telemetry","event":"OpenTelemetry SDK initialized with OTLP gRPC collector exporter","endpoint":"http://otel-collector:4317","trace_id":"","span_id":""}
{"timestamp":"2024-01-15T10:00:01.245Z","level":"INFO","service":"delta_ws","event":"Delta WebSocket service initialized","ws_url":"wss://socket.demo.delta.exchange","trace_id":"","span_id":""}
{"timestamp":"2024-01-15T10:00:02.881Z","level":"INFO","service":"delta_ws","event":"Delta WebSocket connection established","url":"wss://socket.demo.delta.exchange","trace_id":"","span_id":""}
```

## HTTP Request Logs (INFO)

```json
{"timestamp":"2024-01-15T10:00:15.023Z","level":"INFO","service":"http_request","event":"Request processed","method":"GET","path":"/health","status_code":200,"duration_ms":3.2,"latency_ms":3.2,"client_host":"172.20.0.1","request_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","span_id":"00f067aa0ba902b7"}
{"timestamp":"2024-01-15T10:00:16.441Z","level":"INFO","service":"http_request","event":"Request processed","method":"GET","path":"/api/v1/market/tickers","status_code":200,"duration_ms":23.4,"latency_ms":23.4,"client_host":"172.20.0.1","request_id":"b2c3d4e5-f6a7-8901-bcde-f12345678901","trace_id":"3e4d5c6b7a8f9e0d1c2b3a4b5c6d7e8f","span_id":"1a2b3c4d5e6f7a8b"}
{"timestamp":"2024-01-15T10:00:17.019Z","level":"INFO","service":"http_request","event":"Request processed","method":"GET","path":"/metrics","status_code":200,"duration_ms":1.8,"latency_ms":1.8,"client_host":"172.20.0.7","request_id":"c3d4e5f6-a7b8-9012-cdef-012345678902","trace_id":"","span_id":""}
{"timestamp":"2024-01-15T10:00:22.887Z","level":"INFO","service":"http_request","event":"Request processed","method":"GET","path":"/api/v1/market/tickers","status_code":200,"duration_ms":18.7,"latency_ms":18.7,"client_host":"172.20.0.1","request_id":"d4e5f6a7-b8c9-0123-defa-123456789012","trace_id":"5cf03f4688c45eb7b4dfd03011f5e847","span_id":"2b3c4d5e6f7a8b9c"}
```

## Delta Exchange WebSocket Tick Logs

```json
{"timestamp":"2024-01-15T10:00:18.334Z","level":"DEBUG","service":"delta_ws","event":"Failed to cache WS message","error":"None","trace_id":"","span_id":""}
```

## Warning Logs

```json
{"timestamp":"2024-01-15T10:00:03.512Z","level":"WARNING","service":"delta_ws","event":"WebSocket connection lost, scheduling reconnect","error":"connection refused","attempt":1,"backoff_delay":2.0,"trace_id":"","span_id":""}
{"timestamp":"2024-01-15T10:00:05.743Z","level":"WARNING","service":"delta_rest","event":"Transient exchange error, retrying","status_code":429,"attempt":1,"backoff_seconds":0.5,"trace_id":"3e4d5c6b7a8f9e0d1c2b3a4b5c6d7e8f","span_id":"1a2b3c4d5e6f7a8b"}
```

## Error Logs (AUTH — expected for unconfigured API key)

```json
{"timestamp":"2024-01-15T10:01:44.112Z","level":"ERROR","service":"http_request","event":"Request processed","method":"GET","path":"/api/v1/portfolio/summary","status_code":401,"duration_ms":8.1,"latency_ms":8.1,"client_host":"172.20.0.1","request_id":"e5f6a7b8-c9d0-1234-efab-234567890123","trace_id":"6df14a5799d56fc8c5ege14122g6f958","span_id":"3c4d5e6f7a8b9c0d"}
```

## Loki Query to Retrieve These Logs

In Grafana Explore (Loki datasource):

```logql
# All backend logs
{service="deltaops"}

# Errors only
{service="deltaops"} | json | level = "ERROR"

# Slow requests (>100ms)
{service="deltaops"} | json | latency_ms > 100

# Requests with trace context
{service="deltaops"} | json | trace_id != ""

# Specific endpoint
{service="deltaops"} | json | path = "/api/v1/market/tickers"
```

## Label Cardinality in Loki

Promtail extracts these stream labels from each container:

| Label | Example Value | Source |
|-------|---------------|--------|
| `service` | `deltaops` | JSON field in log line |
| `level` | `INFO`, `WARNING`, `ERROR` | JSON field in log line |
| `stream` | `stdout` | Docker stream |
| `container` | `deltaops-backend` | Docker container name |
| `project` | `observability-platform-for-real-time-market-data` | Docker Compose project |
