# DeltaOps Architecture Specification

## Executive Summary

DeltaOps is designed as a modular, microservice-friendly cryptocurrency trading platform. The architecture prioritizes low-latency market data handling, strict isolation between trade execution and risk validation, and end-to-end telemetry.

---

## 1. High-Level System Topology

```
                  ┌─────────────────────────────────────┐
                  │        Delta Exchange Engine        │
                  │   (REST APIs & Real-Time WebSockets) │
                  └──────────────────┬──────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
      (REST Execution)                             (WebSocket Stream)
              │                                             │
              ▼                                             ▼
┌───────────────────────────┐                 ┌───────────────────────────┐
│     Backend Core (OMS)    │                 │    Market Data Adapter    │
│  - Order Lifecycle State  │                 │ - Ticker Normalizer       │
│  - Position Tracker       │                 │ - L2 Orderbook Depth      │
└─────────────┬─────────────┘                 └─────────────┬─────────────┘
              │                                             │
              └──────────────────────┬──────────────────────┘
                                     │
                                     ▼
                          ┌────────────────────┐
                          │   Redis Pub/Sub    │
                          │   Message Bus      │
                          └──────────┬─────────┘
                                     │
                                     ▼
                          ┌────────────────────┐
                          │    API Gateway     │
                          │ (Auth/Rate-Limit)  │
                          └──────────┬─────────┘
                                     │
                                     ▼
                          ┌────────────────────┐
                          │   React Trading    │
                          │   Dashboard UI     │
                          └────────────────────┘
```

---

## 2. Service Boundaries

| Service | Primary Responsibility | Data Source | Communication Protocol |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Auth, Rate-limiting, Client WebSocket Fan-out | Redis / Config | HTTP/REST, WebSocket |
| **Market Data Service** | Delta WS Connection, Orderbook Aggregation | Delta Exchange WS | Redis Pub/Sub, gRPC |
| **Order Engine (OMS)** | Order Validation, Routing, State Management | PostgreSQL, Delta REST | HTTP/Async REST |
| **Risk Engine** | Margin Checks, Position Limits, Liquidation Warning | PostgreSQL, Redis | In-Memory Async Checks |
| **Telemetry Collector** | Span Collection, Metrics Aggregation, Log Shifting | App Telemetry SDKs | OTLP gRPC (Port 4317) |

---

## 3. Data Flow Pipelines

### 3.1 Market Data Pipeline
1. `Market Data Adapter` connects to Delta Exchange `wss://socket.delta.exchange`.
2. Subscribes to `v2/ticker` and `l2_orderbook`.
3. Normalizes messages into uniform JSON schema.
4. Broadcasts to Redis channel `market_data:<symbol>`.
5. `API Gateway` listens to Redis and streams updates to frontend WebSocket subscribers.

### 3.2 Order Placement Flow
1. Frontend submits order via REST `POST /api/v1/orders`.
2. `API Gateway` authenticates token and verifies rate limits.
3. `Risk Engine` checks available margin and open position boundaries.
4. `OMS` writes `PENDING_SUBMIT` to PostgreSQL database.
5. Async client dispatches HTTP POST request to Delta Exchange API.
6. Execution response updates DB status (`OPEN`, `FILLED`, or `REJECTED`) and emits event to WebSocket channel.

---

## 4. Observability Hooks

- **Tracing**: Every inbound API request generates an OpenTelemetry trace ID propagated across Gateway, OMS, and Database operations.
- **Metrics**: Counters for `orders_submitted_total`, `websocket_messages_received_total`, and histograms for `order_execution_latency_seconds`.
- **Logs**: Structured JSON logs enriched with `trace_id`, `span_id`, `user_id`, and `order_id`.
