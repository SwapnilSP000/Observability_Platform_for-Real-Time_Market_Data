import json
import asyncio
from typing import Dict, Any, List, Optional, Callable, Set
import websockets
from websockets.exceptions import ConnectionClosed
from backend.app.core.config import settings
from backend.app.core.logging import get_logger

logger = get_logger("delta_ws")


class DeltaWebSocketClient:
    """
    Resilient WebSocket client for Delta Exchange real-time market streams.
    Includes auto-reconnect, heartbeat pinging, subscription persistence, and message callbacks.
    """

    def __init__(
        self,
        ws_url: Optional[str] = None,
        reconnect_interval: float = 2.0,
        heartbeat_interval: float = 15.0,
    ):
        self.ws_url = ws_url or settings.DELTA_WS_URL
        self.reconnect_interval = reconnect_interval
        self.heartbeat_interval = heartbeat_interval
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._is_running: bool = False
        self._active_subscriptions: Set[str] = set()
        self._callbacks: List[Callable[[Dict[str, Any]], None]] = []
        self._listen_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self.reconnect_attempts: int = 0

    @property
    def is_connected(self) -> bool:
        return self._ws is not None and self._ws.open

    def add_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register a callback function to handle incoming WebSocket messages."""
        self._callbacks.append(callback)

    def get_status(self) -> Dict[str, Any]:
        """Returns current WebSocket status summary for health/status API endpoints."""
        return {
            "connected": self.is_connected,
            "wsUrl": self.ws_url,
            "activeSubscriptions": list(self._active_subscriptions),
            "reconnectAttempts": self.reconnect_attempts,
        }

    async def start((self) -> None:
        """Starts the WebSocket connection and background loops."""
        if self._is_running:
            return
        self._is_running = True
        self._listen_task = asyncio.create_task(self._connect_and_listen())
        logger.info("Delta WebSocket service initialized", ws_url=self.ws_url)

    async def stop(self) -> None:
        """Gracefully shuts down WebSocket connection and background tasks."""
        self._is_running = False
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        if self._listen_task:
            self._listen_task.cancel()
        if self._ws:
            await self._ws.close()
            self._ws = None
        logger.info("Delta WebSocket service stopped")

    async def subscribe(self, channel: str, symbols: Optional[List[str]] = None) -> None:
        """Subscribe to a Delta Exchange channel (e.g. 'v2/ticker', 'l2_orderbook')."""
        self._active_subscriptions.add(channel)
        if self.is_connected:
            payload = {
                "type": "subscribe",
                "payload": {
                    "channels": [
                        {"name": channel, "symbols": symbols or ["all"]}
                    ]
                }
            }
            await self._ws.send(json.dumps(payload))
            logger.info("Subscribed to WebSocket channel", channel=channel, symbols=symbols)

    async def _connect_and_listen(self) -> None:
        """Main connection & listening loop with exponential backoff reconnects."""
        delay = self.reconnect_interval

        while self._is_running:
            try:
                logger.info("Connecting to Delta WebSocket", url=self.ws_url)
                async with websockets.connect(self.ws_url, ping_interval=None) as ws:
                    self._ws = ws
                    self.reconnect_attempts = 0
                    delay = self.reconnect_interval
                    logger.info("Delta WebSocket connection established")

                    # Re-subscribe active channels upon reconnect
                    if self._active_subscriptions:
                        for channel in self._active_subscriptions:
                            await self.subscribe(channel)

                    # Start heartbeat ping task
                    self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

                    # Read incoming message loop
                    async for message in ws:
                        try:
                            data = json.loads(message)
                            self._dispatch_message(data)
                        except json.JSONDecodeError:
                            logger.warning("Received non-JSON WebSocket frame", raw=message[:100])

            except (ConnectionClosed, OSError, Exception) as err:
                self._ws = None
                self.reconnect_attempts += 1
                if not self._is_running:
                    break
                logger.warning(
                    "WebSocket connection lost, scheduling reconnect",
                    error=str(err),
                    attempt=self.reconnect_attempts,
                    backoff_delay=delay,
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, 30.0)

    async def _heartbeat_loop(self) -> None:
        """Sends periodic ping messages to keep connection alive."""
        while self._is_running and self.is_connected:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                if self.is_connected:
                    await self._ws.ping()
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.warning("Failed to send WebSocket ping", error=str(err))

    def _dispatch_message(self, data: Dict[str, Any]) -> None:
        """Dispatches decoded message to all registered callbacks."""
        for callback in self._callbacks:
            try:
                callback(data)
            except Exception as err:
                logger.error("Error executing WebSocket message callback", error=str(err))
