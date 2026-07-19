from typing import Dict, Any
from fastapi import APIRouter, status
from backend.app.services.exchange.manager import exchange_manager

router = APIRouter(prefix="/websocket", tags=["WebSocket Stream"])


@router.get(
    "/status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get Exchange WebSocket Status",
    description="Queries internal state of the Delta Exchange background WebSocket client.",
)
async def get_websocket_status() -> Dict[str, Any]:
    return exchange_manager.ws_client.get_status()
