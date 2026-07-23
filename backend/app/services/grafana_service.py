import os
import httpx
from typing import Dict, Any, List, Optional
from backend.app.core.logging import get_logger

logger = get_logger("grafana_service")


class GrafanaService:
    """
    Secure backend integration layer communicating with Grafana REST APIs.
    Shields credentials and API tokens from the frontend client.
    """

    def __init__(
        self,
        grafana_url: str = os.environ.get("GRAFANA_URL", "http://grafana:3000"),
        admin_user: str = os.environ.get("GRAFANA_ADMIN_USER", "admin"),
        admin_password: str = os.environ.get("GRAFANA_ADMIN_PASSWORD", "deltaops_admin_pass"),
    ):
        self.grafana_url = grafana_url.rstrip("/")
        self.auth = (admin_user, admin_password)

    async def get_dashboards(self) -> List[Dict[str, Any]]:
        """Fetch list of all auto-provisioned Grafana dashboards."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.grafana_url}/api/search", auth=self.auth)
                if res.status_code == 200:
                    return res.json()
        except Exception as err:
            logger.warning("Failed to connect to Grafana API", error=str(err))

        # Fallback metadata if Grafana container is initializing
        return [
          {"uid": "deltaops-exec-overview", "title": "01. Executive Overview", "url": "/d/deltaops-exec-overview", "type": "dash-db"},
          {"uid": "deltaops-infra", "title": "02. Infrastructure & Docker Health", "url": "/d/deltaops-infra", "type": "dash-db"},
          {"uid": "deltaops-api-perf", "title": "03. API Performance & Latency", "url": "/d/deltaops-api-perf", "type": "dash-db"},
          {"uid": "deltaops-market", "title": "04. Market & WebSocket Stream Data", "url": "/d/deltaops-market", "type": "dash-db"},
          {"uid": "deltaops-logs", "title": "05. Loki Structured System Logs", "url": "/d/deltaops-logs", "type": "dash-db"},
          {"uid": "deltaops-traces", "title": "06. Jaeger OpenTelemetry Traces", "url": "/d/deltaops-traces", "type": "dash-db"},
          {"uid": "deltaops-alerts", "title": "07. Alertmanager System Alerts", "url": "/d/deltaops-alerts", "type": "dash-db"}
        ]

    async def check_health(self) -> bool:
        """Check Grafana health API."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.grafana_url}/api/health")
                return res.status_code == 200
        except Exception:
            return False


grafana_service = GrafanaService()
