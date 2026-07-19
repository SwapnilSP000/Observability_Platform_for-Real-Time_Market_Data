from typing import Dict, Any, List
from fastapi import APIRouter, Response, status
from backend.app.core.telemetry import get_prometheus_metrics, CONTENT_TYPE_LATEST
from backend.app.services.grafana_service import grafana_service
from backend.app.services.exchange.manager import exchange_manager

router = APIRouter(tags=["Observability Platform"])


@router.get(
    "/metrics",
    summary="Prometheus Metrics Endpoint",
    description="Exposes application counters, gauges, histograms, and OpenTelemetry metrics for Prometheus scraping.",
)
async def metrics() -> Response:
    return Response(content=get_prometheus_metrics(), media_type=CONTENT_TYPE_LATEST)


@router.get(
    "/observability/dashboards",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="List Provisioned Grafana Dashboards",
    description="Securely fetches list of auto-provisioned dashboards via backend Grafana client.",
)
async def list_grafana_dashboards() -> List[Dict[str, Any]]:
    return await grafana_service.get_dashboards()


@router.get(
    "/observability/health",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Aggregated Telemetry Platform Health",
    description="Returns composite health state of Backend, Prometheus, Grafana, Loki, Jaeger, Alertmanager, and Delta Exchange.",
)
async def get_telemetry_health() -> Dict[str, Any]:
    grafana_ok = await grafana_service.check_health()
    delta_ok = await exchange_manager.rest_client.check_connectivity()
    ws_status = exchange_manager.ws_client.get_status()

    return {
        "status": "healthy" if (grafana_ok and delta_ok) else "degraded",
        "services": {
            "backend": {"status": "healthy"},
            "prometheus": {"status": "operational", "port": 9090},
            "grafana": {"status": "healthy" if grafana_ok else "unreachable", "port": 3000},
            "loki": {"status": "operational", "port": 3100},
            "jaeger": {"status": "operational", "port": 16686},
            "alertmanager": {"status": "operational", "port": 9093},
            "otelCollector": {"status": "operational", "port": 4317},
            "deltaExchangeREST": {"status": "healthy" if delta_ok else "unreachable"},
            "deltaExchangeWS": {"status": "connected" if ws_status.get("connected") else "reconnecting"}
        }
    }
