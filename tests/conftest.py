import pytest
from typing import Generator
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import Settings


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """FastAPI TestClient fixture."""
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
