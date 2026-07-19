# API Guidelines & Naming Standards - DeltaOps

## 1. RESTful API Conventions

### Base URIs
- Production: `https://api.deltaops.internal/api/v1`
- Staging: `https://api.staging.deltaops.internal/api/v1`
- Local: `http://localhost:8000/api/v1`

### Case & Formatting Rules
- **URLs**: Lowercase hyphenated kebab-case (e.g., `/api/v1/market-data/orderbook`).
- **JSON Fields**: camelCase for API JSON requests/responses (e.g., `orderType`, `filledSize`).
- **Query Parameters**: snake_case or camelCase (e.g., `symbol=BTC-PERP&page_size=50`).

### HTTP Methods & Status Codes
- `GET`: Retrieve resource. Return `200 OK`.
- `POST`: Create resource. Return `201 Created`.
- `PUT` / `PATCH`: Update resource. Return `200 OK`.
- `DELETE`: Remove resource. Return `204 No Content`.

#### Standard Error Response Format
```json
{
  "error": {
    "code": "INSUFFICIENT_MARGIN",
    "message": "Available margin ($150.00) is below required margin ($500.00)",
    "timestamp": "2026-07-20T00:30:00Z",
    "traceId": "0af7651916cd43dd8448eb211c80319c"
  }
}
```

---

## 2. WebSocket Protocol Specifications

### Endpoint
`ws://localhost:8000/ws/v1`

### Channel Subscription Payload
```json
{
  "action": "subscribe",
  "channels": ["ticker:BTC-PERP", "orderbook:BTC-PERP"]
}
```

### Server Event Format
```json
{
  "channel": "ticker:BTC-PERP",
  "timestamp": 1784507400000,
  "data": {
    "symbol": "BTC-PERP",
    "markPrice": "64250.00",
    "bid": "64249.50",
    "ask": "64250.50",
    "volume24h": "1205432.50"
  }
}
```
