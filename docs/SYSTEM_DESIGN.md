# System Design Document - DeltaOps

## 1. Domain Entities & Database Schema Design

### 1.1 Core Entities

#### Users / Accounts
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `api_key_hash`: String
- `created_at`: Timestamp UTC

#### Orders
- `id`: UUID (Primary Key)
- `external_order_id`: String (Delta Exchange Order ID)
- `user_id`: UUID (Foreign Key)
- `symbol`: String (e.g., "BTC-PERP")
- `side`: Enum (`BUY`, `SELL`)
- `order_type`: Enum (`LIMIT`, `MARKET`, `STOP_LIMIT`)
- `price`: Numeric(18, 8)
- `size`: Numeric(18, 8)
- `filled_size`: Numeric(18, 8)
- `status`: Enum (`CREATED`, `PENDING_SUBMIT`, `OPEN`, `FILLED`, `CANCELLED`, `REJECTED`)
- `created_at`: Timestamp UTC
- `updated_at`: Timestamp UTC

#### Positions
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `symbol`: String
- `entry_price`: Numeric(18, 8)
- `current_size`: Numeric(18, 8)
- `leverage`: Numeric(5, 2)
- `liquidation_price`: Numeric(18, 8)
- `unrealized_pnl`: Numeric(18, 8)
- `realized_pnl`: Numeric(18, 8)

---

## 2. Order Management State Machine

```
      [ User Request ]
             │
             ▼
        ( CREATED )
             │
      Passed Risk Checks
             │
             ▼
    ( PENDING_SUBMIT ) ─────── API Failure ────────► ( REJECTED )
             │
   Delta Ack Received
             │
             ▼
         ( OPEN ) ────────── Cancel Request ───────► ( CANCELLED )
             │
      Partial / Full Match
             │
             ▼
        ( FILLED )
```

---

## 3. High-Throughput WebSocket Broadcast Design

- **Connection Pool**: API Gateway maintains client WebSockets using AsyncIO tasks.
- **Backpressure Handling**: Unbounded queues are prohibited. Subscriptions use bounded channels (`maxsize=1000`). Slow clients are disconnected automatically to prevent event queue starvation.
- **Heartbeat & Reconnect**: Gateway sends ping every 15s. Client auto-reconnects with exponential backoff (`min_delay=1s`, `max_delay=30s`).
