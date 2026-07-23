import pytest
from typing import Generator
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from backend.app.core.config import Settings


@pytest.fixture(autouse=True)
def mock_startup_dependencies():
    """
    Prevent real network calls during test startup.
    Mocks: OTel SDK init, exchange clock sync, WS start.
    """
    with patch("backend.app.core.telemetry.setup_telemetry", return_value=MagicMock()):
        with patch(
            "backend.app.services.exchange.manager.exchange_manager.initialize",
            new_callable=AsyncMock,
        ):
            with patch(
                "backend.app.services.exchange.manager.exchange_manager.shutdown",
                new_callable=AsyncMock,
            ):
                yield


@pytest.fixture
def client(mock_startup_dependencies) -> Generator[TestClient, None, None]:
    """FastAPI TestClient fixture with mocked startup."""
    from backend.app.main import app
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_settings() -> Settings:
    """Provides test-isolated Settings instance."""
    return Settings(
        APP_ENV="testing",
        LOG_LEVEL="DEBUG",
        DELTA_API_KEY="test_api_key_12345678",
        DELTA_API_SECRET="test_api_secret_87654321",
    )
