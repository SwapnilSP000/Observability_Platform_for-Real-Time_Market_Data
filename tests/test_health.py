from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


def test_get_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["appName"] == "DeltaOps Engine"
    assert "version" in data
    assert "timestamp" in data


def test_get_version(client: TestClient) -> None:
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["appName"] == "DeltaOps Engine"
    assert "pythonVersion" in data
    assert "version" in data


@patch("backend.app.services.exchange.manager.exchange_manager.rest_client.check_connectivity", new_callable=AsyncMock)
def test_get_status(mock_check: AsyncMock, client: TestClient) -> None:
    mock_check.return_value = True

    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "exchangeConnectivity" in data
    assert data["exchangeConnectivity"]["deltaExchange"]["reachable"] is True
    assert "webSocketState" in data
