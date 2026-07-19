import sys
from datetime import datetime, timezone
from fastapi import APIRouter, status
from backend.app.core.config import settings
from backend.app.schemas.health import HealthResponse, VersionResponse, StatusResponse
from backend.app.services.exchange.manager import exchange_manager

router = APIRouter(tags=["Health & Status"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    description="Returns current health state of the application instance.",
)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        appName=settings.APP_NAME,
        environment=settings.APP_ENV,
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/version",
    response_model=VersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Version Details",
    description="Returns current build version, Python runtime version, and environment context.",
)
async def get_version() -> VersionResponse:
    python_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    return VersionResponse(
        appName=settings.APP_NAME,
        version=settings.APP_VERSION,
        pythonVersion=python_ver,
        environment=settings.APP_ENV,
    )


@router.get(
    "/status",
    response_model=StatusResponse,
    status_code=status.HTTP_200_OK,
    summary="System & Exchange Connectivity Status",
    description="Exposes exchange connectivity, WebSocket connection state, and masked API key info without leaking secrets.",
)
async def get_status() -> StatusResponse:
    delta_reachable = await exchange_manager.rest_client.check_connectivity()
    ws_status = exchange_manager.ws_client.get_status()

    exchange_info = {
        "deltaExchange": {
            "restUrl": settings.DELTA_BASE_URL,
            "wsUrl": settings.DELTA_WS_URL,
            "apiKeyConfigured": bool(settings.DELTA_API_KEY.get_secret_value()),
            "maskedApiKey": settings.get_masked_delta_key(),
            "reachable": delta_reachable,
        }
    }

    return StatusResponse(
        status="operational" if delta_reachable else "degraded",
        environment=settings.APP_ENV,
        exchangeConnectivity=exchange_info,
        webSocketState=ws_status,
        timestamp=datetime.now(timezone.utc),
    )
