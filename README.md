<div align="center">

# ⚡ DeltaOps
### Enterprise Cryptocurrency Trading Platform with Full Observability

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/CI%2FCD-Passing-emerald?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.50-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io)
[![Grafana](https://img.shields.io/badge/Grafana-v10.3-F46800?logo=grafana&logoColor=white)](https://grafana.com)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Enabled-F54883?logo=opentelemetry&logoColor=white)](https://opentelemetry.io)

---

**DeltaOps** is a production-grade, microservice-friendly cryptocurrency trading platform designed for high-frequency market data ingestion, automated order execution, real-time risk management, and enterprise-grade observability. Integrated with **Delta Exchange API & WebSocket feeds**.

[Architecture Docs](docs/ARCHITECTURE.md) • [System Design](docs/SYSTEM_DESIGN.md) • [API Guidelines](docs/API_GUIDELINES.md) • [Developer Guide](docs/DEVELOPMENT.md) • [Deployment Strategy](docs/DEPLOYMENT.md) • [Observability Report](docs/OBSERVABILITY_REPORT.md) • [Roadmap](ROADMAP.md) • [Screenshots Showcase](assets/screenshots/README.md)

</div>

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Design Aesthetics (AWS Cloudscape 2024)](#-design-aesthetics-aws-cloudscape-2024)
- [Observability Platform Architecture](#-observability-platform-architecture)
- [Single-Command Quick Start](#-single-command-quick-start)
- [Service Endpoint Registry](#-service-endpoint-registry)
- [Pre-Built Grafana Dashboards](#-pre-built-grafana-dashboards)
- [Portfolio Showcase & Screenshots](#-portfolio-showcase--screenshots)
- [CI/CD Automation](#-cicd-automation)
- [Backend & Frontend Development Setup](#-backend--frontend-development-setup)
- [Connectivity & Gateway Verification](#-connectivity--gateway-verification)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌌 Overview

Modern quantitative trading platforms require sub-millisecond execution capabilities alongside end-to-end trace visibility. **DeltaOps** bridges high-performance market connectivity with cloud-native telemetry, serving as a blueprint for institutional-grade trading platforms (inspired by Binance, Coinbase Pro, Zerodha, and Delta Exchange).

The platform integrates directly with the Delta Exchange API, implementing signature-based authentication (HMAC-SHA256) and a robust WebSocket client that maintains a persistent connection for L2 orderbook feeds and ticker updates.

---

## 🎨 Design Aesthetics (AWS Cloudscape 2024)

DeltaOps implements a complete, professional redesign matching the **AWS Console 2024** visual refresh using the **AWS Cloudscape design system**:

- **Modern Light Theme**: Content cards use a clean `#FFFFFF` surface on a `#F2F3F3` page background, optimizing read times and contrast.
- **Dark Navy Navigation**: Top header (`#232F3E`) and left sidebar (`#1A2535`) navigation mimic the authentic AWS Console layout, featuring collapsible menus, active item highlighting, and clean micro-interactions.
- **AWS Theme Colors**: Features AWS Blue (`#0073BB`) for interactive links, AWS Orange (`#EC7211`) for primary actions, and highly readable `#16191F` primary body text.
- **Vibrant Status Indicators**: Active status components use high-contrast color tones (Success Green `#1D8102`, Warning Amber `#7D4A08`, Danger/Error Red `#D13212`) alongside pulsing animations for live feeds.

---

## 🏗️ Observability Platform Architecture

```
                  ┌─────────────────────────────────────┐
                  │        Delta Exchange API           │
                  │   & WebSocket Market Feeds          │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │    FastAPI Core Backend Engine      │
                  │  (OpenTelemetry SDK + Prometheus)   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      OpenTelemetry Collector        │
                  │         (OTLP gRPC Port 4317)       │
                  └──────────┬───────┬───────┬──────────┘
                             │       │       │
             ┌───────────────┘       │       └──────────────┐
             ▼                       ▼                      ▼
     ┌───────────────┐       ┌───────────────┐      ┌───────────────┐
     │  Prometheus   │       │     Loki      │      │    Jaeger     │
     │  (Metrics)    │       │ (Logs Engine) │      │   (Traces)    │
     └───────┬───────┘       └───────┬───────┘      └───────┬───────┘
             │                       │                      │
             └───────────────────────┼──────────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │       Grafana Visualization         │
                  │    (Auto-Provisioned Dashboards)    │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      Backend Grafana API Client     │
                  │    (Secure Zero-Credential Proxy)   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │    React 18 Trading Dashboard UI    │
                  └─────────────────────────────────────┘
```

The telemetry pipeline consists of three core streams:
1. **Metrics**: FastAPI exposes metrics via `/metrics` using Prometheus Client. The Prometheus server scrapes endpoints and feeds data into Grafana.
2. **Traces**: OpenTelemetry SDK automatically instruments FastAPI requests and outgoing HTTP client requests, exporting spans via gRPC OTLP format to the OpenTelemetry Collector, which routes them to Jaeger.
3. **Logs**: Applications print structured JSON logs (formatted via a custom `LokiJSONFormatter` to include standard fields, custom telemetry, and OTel `trace_id` / `span_id`). Promtail watches Docker containers and pushes logs to Loki.

---

## 🚀 Single-Command Quick Start

Launch the complete 12-microservice production stack (Backend, Frontend, Prometheus, Grafana, Loki, Promtail, Jaeger, OpenTelemetry Collector, cAdvisor, Node Exporter, Alertmanager, Redis):

```bash
docker compose up --build
```

No manual dashboard setup is required! Grafana data sources and dashboards are automatically provisioned.

---

## 🌐 Service Endpoint Registry

| Service | Port / URI | Description | Credentials / Details |
| :--- | :--- | :--- | :--- |
| **React Trading Dashboard** | `http://localhost:5173` | Web UI (styled in AWS Cloudscape) | Public |
| **FastAPI Backend Service** | `http://localhost:8000` | REST API Engine | Public |
| **Swagger UI Specs** | `http://localhost:8000/docs` | OpenAPI UI | Public |
| **Prometheus Metrics** | `http://localhost:8000/metrics` | App Metrics Endpoint | Public |
| **Grafana Platform** | `http://localhost:3000` | Visualization UI | `admin` / `deltaops_admin_pass` |
| **Prometheus Server** | `http://localhost:9090` | Metrics Scraper & Engine | Auto-scrapes all services |
| **Jaeger Tracing UI** | `http://localhost:16686` | Distributed Tracing UI | OTLP Target `otel-collector:4317` |
| **Alertmanager** | `http://localhost:9093` | Alert Notification Manager | Pre-configured alerts |
| **Loki Log Engine** | `http://localhost:3100` | Structured Log Store | Tailed by Promtail |
| **OTel Collector** | `http://localhost:4317` / `http://localhost:4318` | Telemetry Receiver | Ports: 4317 (gRPC), 4318 (HTTP), 8889 (Metrics), 13133 (Health) |
| **cAdvisor Container** | `http://localhost:8080` | Container Resource Monitor | Host container monitoring |
| **Node Exporter** | `http://localhost:9100` | Bare-Metal OS Metrics | OS monitoring |

---

## 📊 Pre-Built Grafana Dashboards

The platform includes 7 pre-built dashboards in `dashboards/`:
1. `01. Executive Overview` (`deltaops-exec-overview`)
2. `02. Infrastructure & Docker Health` (`deltaops-infra`)
3. `03. API Performance & Latency` (`deltaops-api-perf`)
4. `04. Market & WebSocket Stream Data` (`deltaops-market`)
5. `05. Loki Structured System Logs` (`deltaops-logs`)
6. `06. Jaeger OpenTelemetry Traces` (`deltaops-traces`)
7. `07. Alertmanager System Alerts` (`deltaops-alerts`)

---

## 📸 Portfolio Showcase & Screenshots

For instructions on capturing portfolio assets for recruiters, see [assets/screenshots/README.md](assets/screenshots/README.md).

---

## ⚙️ CI/CD Automation

We enforce quality standards on every push and pull request via GitHub Actions:
- **Python Quality**: Enforced via `black`, `ruff`, `isort`, and `pytest`.
- **Frontend Quality**: TypeScript typechecking and production bundling.
- **Infrastructure Validation**: `docker compose config` validation.

---

## 💻 Backend & Frontend Development Setup

### Backend:
```bash
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔍 Connectivity & Gateway Verification

DeltaOps includes a diagnostic gateway tool to verify system configurations and confirm authentication against the Delta Exchange API endpoints:

```bash
python run_verify.py
```

This script:
1. Performs clock skew checks by comparing your local time against the Delta Exchange server time (`/v2/time`).
2. Calculates secure, timestamped signatures using HMAC-SHA256 hashing.
3. Tests connection to authenticated endpoints:
   - Wallet Balance Check (`/v2/wallet/balances`)
   - Margined Positions Check (`/v2/positions/margined`)
   - Open Orders Fetching (`/v2/orders?state=open`)
4. Validates connection health and reports latency measurements.

---

## ❓ Troubleshooting & FAQ

#### Q: Port 3000 or 8000 is already in use?
> Change the port mappings in `docker-compose.yml` or stop conflicting local services.

#### Q: WebSocket feed shows disconnected in header?
> Verify `DELTA_WS_URL=wss://socket.delta.exchange` in `.env` and verify outbound network connectivity.

#### Q: Signature validation fails on authenticated endpoints?
> Ensure your `DELTA_API_KEY` and `DELTA_API_SECRET` in `.env` are active and correct.

---

## 🤝 Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## ⚖️ License

Distributed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.
