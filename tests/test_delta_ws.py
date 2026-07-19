import pytest
from backend.app.services.exchange.delta_ws import DeltaWebSocketClient


@pytest.mark.asyncio
async def test_delta_ws_client_initial_state() -> None:
    ws_client = DeltaWebSocketClient(ws_url="wss://socket.delta.exchange")
    assert ws_client.is_connected is False
    status = ws_client.get_status()
    assert status["connected"] is False
    assert status["wsUrl"] == "wss://socket.delta.exchange"
    assert status["reconnectAttempts"] == 0


@pytest.mark.asyncio
async def test_delta_ws_subscription_register() -> None:
    ws_client = DeltaWebSocketClient()
    await ws_client.subscribe("v2/ticker")
    status = ws_client.get_status()
    assert "v2/ticker" in status["activeSubscriptions"]
