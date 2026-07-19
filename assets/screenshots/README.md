# DeltaOps Portfolio Screenshots & Recording Guide

This directory contains visual assets and screenshots demonstrating the **DeltaOps** Enterprise Trading Platform in action.

---

## 📸 Recommended Screenshots for Portfolio Showcase

When presenting this project to recruiters, hiring managers, or open-source contributors, capture the following high-resolution screenshots after launching the stack (`docker compose up --build`):

1. **`01_executive_dashboard.png`**
   - **View**: Home Executive Dashboard (`http://localhost:5173`)
   - **Highlights**: BTC/ETH live price tickers, system latency gauge, API health status, and latency trend area chart.

2. **`02_trading_terminal.png`**
   - **View**: Trading Terminal Viewport (`http://localhost:5173/trading`)
   - **Highlights**: Candlestick viewport, live L2 Orderbook depth (bids/asks), Buy/Sell order execution form, and active positions tab.

3. **`03_market_directory.png`**
   - **View**: Crypto Derivatives Market Page (`http://localhost:5173/markets`)
   - **Highlights**: Searchable cryptocurrency pairs, 24h volume, mark prices, funding rates, and open interest.

4. **`04_portfolio_analytics.png`**
   - **View**: Account Portfolio (`http://localhost:5173/portfolio`)
   - **Highlights**: Total equity, available vs used margin, unrealized PnL breakdown, and asset allocation pie/bar chart.

5. **`05_grafana_executive_overview.png`**
   - **View**: Grafana Dashboard 01 (`http://localhost:3000/d/deltaops-exec-overview`)
   - **Highlights**: System health stats, total API throughput (req/sec), P95 latency gauge, and active WebSocket streams.

6. **`06_grafana_infrastructure.png`**
   - **View**: Grafana Dashboard 02 (`http://localhost:3000/d/deltaops-infra`)
   - **Highlights**: CPU utilization %, Memory consumption %, and container resource limits via cAdvisor.

7. **`07_loki_system_logs.png`**
   - **View**: Grafana Loki Log Stream (`http://localhost:3000/d/deltaops-logs`)
   - **Highlights**: Structured JSON log entries formatted by Promtail enriched with `trace_id` and `request_id`.

8. **`08_jaeger_traces.png`**
   - **View**: Jaeger UI Trace Spans (`http://localhost:16686`)
   - **Highlights**: OpenTelemetry trace span timeline and service dependency graph.

9. **`09_docker_compose_ps.png`**
   - **View**: Terminal Output (`docker compose ps`)
   - **Highlights**: All 12 microservices running cleanly in `healthy` state.

---

## 🛠️ Capture Guidelines

- Use high-DPI browser scaling (100% or 125%).
- Enable Dark Theme across all browsers.
- Ensure active market ticker updates are visible in the orderbook depth.
