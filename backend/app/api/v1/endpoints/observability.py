import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, Response, Query, status
from backend.app.core.telemetry import get_prometheus_metrics, CONTENT_TYPE_LATEST
from backend.app.services.grafana_service import grafana_service
from backend.app.services.observability_service import observability_service
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
    # Run infra health check + exchange checks concurrently
    infra_health, delta_ok, grafana_ok = await asyncio.gather(
        observability_service.get_system_health(),
        exchange_manager.rest_client.check_connectivity(),
        grafana_service.check_health(),
    )
    ws_status = exchange_manager.ws_client.get_status()

    # infra_health is {"services": {...}, "summary": {...}}
    services = infra_health.get("services", {})

    # Override grafana with the real Grafana service health check result
    services["grafana"] = {
        "status": "operational" if grafana_ok else "unreachable",
        "port": 3000,
        "url": "localhost:3000",
        **({"error": "Connection refused — run: docker compose up -d grafana"} if not grafana_ok else {}),
    }

    # Add Delta Exchange connectivity
    services["deltaExchangeREST"] = {
        "status": "healthy" if delta_ok else "unreachable",
        "url": "testnet-api.delta.exchange",
    }
    services["deltaExchangeWS"] = {
        "status": "connected" if ws_status.get("connected") else "reconnecting",
        "url": "cdn-ind-ws.testnet.deltaex.org",
        "reconnectAttempts": ws_status.get("reconnect_attempts", 0),
    }

    # Recount now that we've added exchange services
    operational = sum(
        1 for s in services.values()
        if s.get("status") in ("healthy", "operational", "connected")
    )
    total = len(services)

    return {
        "status": "healthy" if delta_ok else "degraded",
        "services": services,
        "summary": {
            "operational": operational,
            "total": total,
            "percentage": round((operational / total) * 100, 1) if total else 0,
        },
    }


@router.get(
    "/observability/logs",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Query Loki Log Streams",
    description="Queries live log streams directly from Loki API (/loki/api/v1/query_range).",
)
async def query_loki_logs(
    query: str = Query('{app="backend"}', description="LogQL Query string"),
    limit: int = Query(20, description="Max logs to return"),
) -> List[Dict[str, Any]]:
    return await observability_service.query_loki_logs(query=query, limit=limit)


@router.get(
    "/observability/traces",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Query Jaeger Spans and Traces",
    description="Queries live span graphs directly from Jaeger OTLP API (/api/traces).",
)
async def query_jaeger_traces(
    service: str = Query("backend", description="Service name"),
    limit: int = Query(10, description="Max traces to return"),
) -> List[Dict[str, Any]]:
    return await observability_service.query_jaeger_traces(service=service, limit=limit)


@router.get(
    "/observability/query-metric",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Query Prometheus PromQL Metric",
    description="Queries PromQL instant metrics directly from Prometheus API (/api/v1/query).",
)
async def query_prometheus_metric(
    query: str = Query("http_requests_total", description="PromQL Query"),
) -> Dict[str, Any]:
    return await observability_service.query_prometheus_metric(query=query)
