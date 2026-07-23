import httpx
import asyncio
from typing import Dict, Any, List
from backend.app.core.logging import get_logger

logger = get_logger("observability_service")


class ObservabilityService:
    """
    Service querying live Telemetry & Observability endpoints (Prometheus, Loki, Jaeger, Alertmanager).
    Returns real telemetry response payloads or active health states.
    """

    def __init__(
        self,
        prometheus_url: str = "http://localhost:9090",
        loki_url: str = "http://localhost:3100",
        jaeger_url: str = "http://localhost:16686",
        alertmanager_url: str = "http://localhost:9093",
    ):
        self.prometheus_url = prometheus_url.rstrip("/")
        self.loki_url = loki_url.rstrip("/")
        self.jaeger_url = jaeger_url.rstrip("/")
        self.alertmanager_url = alertmanager_url.rstrip("/")

    async def get_system_health(self) -> Dict[str, Any]:
        """Queries health status of all telemetry services concurrently with detailed info."""

        async def _check(client: httpx.AsyncClient, name: str, url: str, port: int = None) -> tuple[str, Dict[str, Any]]:
            try:
                res = await client.get(url)
                result = {
                    "status": "operational" if res.status_code == 200 else "degraded",
                    "statusCode": res.status_code,
                    "responseTime": int(res.elapsed.total_seconds() * 1000),  # ms
                }
                if port:
                    result["port"] = port
                    result["url"] = url.split("://")[1].split("/")[0]  # Extract host:port
                return name, result
            except httpx.ConnectError:
                return name, {
                    "status": "unreachable",
                    "error": "Connection refused - service not running",
                    "port": port,
                    "instructions": f"Start with: docker compose up -d {name}"
                }
            except httpx.TimeoutException:
                return name, {"status": "timeout", "error": "Request timed out", "port": port}
            except Exception as err:
                return name, {"status": "error", "error": str(err), "port": port}

        async with httpx.AsyncClient(timeout=3.0) as client:
            results = await asyncio.gather(
                _check(client, "prometheus", f"{self.prometheus_url}/-/healthy", 9090),
                _check(client, "loki", f"{self.loki_url}/ready", 3100),
                _check(client, "jaeger", f"{self.jaeger_url}/", 16686),
                _check(client, "alertmanager", f"{self.alertmanager_url}/-/healthy", 9093),
                _check(client, "grafana", "http://localhost:3000/api/health", 3000),
                # 8889 is the otel-collector Prometheus metrics exporter (HTTP) — 4317 is gRPC only
                _check(client, "otelCollector", "http://localhost:8889/metrics", 4317),
            )

        statuses: Dict[str, Any] = dict(results)
        statuses["backend"] = {
            "status": "healthy",
            "port": 8000,
            "url": "localhost:8000"
        }
        
        # Count operational services
        operational_count = sum(1 for s in statuses.values() if s.get("status") in ["healthy", "operational"])
        total_count = len(statuses)
        
        return {
            "services": statuses,
            "summary": {
                "operational": operational_count,
                "total": total_count,
                "percentage": round((operational_count / total_count) * 100, 1)
            }
        }

    async def query_prometheus_metric(self, query: str) -> Dict[str, Any]:
        """Queries Prometheus Instant Query API (/api/v1/query). Returns error/unreachable state if offline."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(
                    f"{self.prometheus_url}/api/v1/query",
                    params={"query": query},
                )
                if res.status_code == 200:
                    return res.json()
                return {"status": "error", "error": f"Prometheus returned HTTP {res.status_code}"}
        except Exception as err:
            logger.warning("Failed to query Prometheus API", error=str(err))
            return {"status": "unreachable", "error": str(err)}

    async def query_loki_logs(self, query: str = '{app="backend"}', limit: int = 20) -> List[Dict[str, Any]]:
        """Queries Loki Log Range API (/loki/api/v1/query_range). Returns empty list if Loki is offline."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(
                    f"{self.loki_url}/loki/api/v1/query_range",
                    params={"query": query, "limit": limit},
                )
                if res.status_code == 200:
                    data = res.json()
                    streams = data.get("data", {}).get("result", [])
                    logs = []
                    for stream in streams:
                        labels = stream.get("stream", {})
                        for entry in stream.get("values", []):
                            logs.append({
                                "timestamp": entry[0],
                                "line": entry[1],
                                "labels": labels,
                            })
                    return logs
                return []
        except Exception as err:
            logger.warning("Failed to query Loki API", error=str(err))
            return []

    async def query_jaeger_traces(self, service: str = "backend", limit: int = 10) -> List[Dict[str, Any]]:
        """Queries Jaeger Trace Search API (/api/traces)."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    f"{self.jaeger_url}/api/traces",
                    params={"service": service, "limit": limit},
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data", [])
                return []
        except Exception as err:
            logger.warning("Failed to query Jaeger API", error=str(err))
            return []


observability_service = ObservabilityService()
