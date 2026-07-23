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
        self._active_subscriptions: Dict[str, List[str]] = {}
        self._callbacks: List[Callable[[Dict[str, Any]], None]] = []
        self._listen_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self.reconnect_attempts: int = 0

    @property
    def is_connected(self) -> bool:
        return self._ws is not None and not getattr(self._ws, 'closed', True)

    def add_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register a callback function to handle incoming WebSocket messages."""
        self._callbacks.append(callback)

    def get_status(self) -> Dict[str, Any]:
        """Returns current WebSocket status summary for health/status API endpoints."""
        return {
            "connected": self.is_connected,
            "wsUrl": self.ws_url,
            "activeSubscriptions": list(self._active_subscriptions.keys()),
            "reconnectAttempts": self.reconnect_attempts,
        }

    async def start(self) -> None:
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
        syms = symbols or ["all"]
        self._active_subscriptions[channel] = syms
        if self.is_connected:
            payload = {
                "type": "subscribe",
                "payload": {
                    "channels": [
                        {"name": channel, "symbols": syms}
                    ]
                }
            }
            await self._ws.send(json.dumps(payload))
            logger.info("Subscribed to WebSocket channel", channel=channel, symbols=syms)

    async def _connect_and_listen(self) -> None:
        """Main connection & listening loop with exponential backoff reconnects."""
        delay = self.reconnect_interval
        from backend.app.core.telemetry import ACTIVE_WEBSOCKET_CONNECTIONS

        ws_candidates = [self.ws_url]
        urls_to_try = []
        for u in ws_candidates:
            if u and u not in urls_to_try:
                urls_to_try.append(u)
        current_url_idx = 0

        while self._is_running:
            target_url = urls_to_try[current_url_idx % len(urls_to_try)]
            try:
                logger.info("Connecting to Delta WebSocket", url=target_url)
                async with websockets.connect(target_url, ping_interval=None) as ws:
                    self._ws = ws
                    ACTIVE_WEBSOCKET_CONNECTIONS.inc()
                    self.reconnect_attempts = 0
                    delay = self.reconnect_interval
                    logger.info("Delta WebSocket connection established", url=target_url)

                    # Re-subscribe active channels or auto-subscribe to ticker stream
                    if self._active_subscriptions:
                        for channel, syms in self._active_subscriptions.items():
                            await self.subscribe(channel, syms)
                    else:
                        await self.subscribe("v2/ticker", ["BTCUSD", "ETHUSD", "SOLUSD"])

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
                self.reconnect_attempts += 1
                current_url_idx += 1
                if not self._is_running:
                    break
                logger.warning(
                    "WebSocket connection lost, scheduling reconnect",
                    error=str(err),
                    attempt=self.reconnect_attempts,
                    backoff_delay=delay,
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, 10.0)
            finally:
                if self._ws:
                    ACTIVE_WEBSOCKET_CONNECTIONS.dec()
                self._ws = None
                if self._heartbeat_task and not self._heartbeat_task.done():
                    self._heartbeat_task.cancel()

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
        """Dispatches decoded message to registered callbacks and exchange_manager ticker cache."""
        from opentelemetry import trace
        tracer = trace.get_tracer("delta_ws")
        
        channel = data.get("type") or data.get("channel") or "unknown"
        symbol = data.get("symbol") or "unknown"

        with tracer.start_as_current_span("websocket_message_process") as span:
            span.set_attribute("websocket.channel", channel)
            span.set_attribute("websocket.symbol", symbol)
            
            try:
                if channel == "v2/ticker" or "mark_price" in data or "close" in data:
                    import time
                    receive_time = time.time()
                    best_ask = float(data.get("best_ask") or 0.0)
                    best_bid = float(data.get("best_bid") or 0.0)
                    if best_ask > 0 and best_bid > 0:
                        spread = round(best_ask - best_bid, 4)
                        data["spread"] = spread
                        span.set_attribute("websocket.ticker.spread", spread)
                    
                    tick_timestamp = data.get("timestamp")
                    if tick_timestamp:
                        try:
                            ts_val = float(tick_timestamp)
                            if ts_val > 1e15:
                                ts_ms = ts_val / 1000.0
                            elif ts_val > 1e12:
                                ts_ms = ts_val
                            elif ts_val > 1e9:
                                ts_ms = ts_val * 1000.0
                            else:
                                ts_ms = ts_val
                            
                            latency_ms = (receive_time * 1000.0) - ts_ms
                            data["processing_latency_ms"] = max(0.0, round(latency_ms, 2))
                            span.set_attribute("websocket.ticker.latency_ms", data["processing_latency_ms"])
                        except (ValueError, TypeError):
                            pass

                    from backend.app.core.telemetry import MARKET_REQUESTS_TOTAL
                    MARKET_REQUESTS_TOTAL.labels(symbol=symbol, endpoint_type="WS_TICK").inc()

                    from backend.app.services.exchange.manager import exchange_manager
                    exchange_manager.update_ticker_cache(data)
            except Exception as exc:
                logger.debug("Failed to cache WS message", error=str(exc))
                span.record_exception(exc)

            for callback in self._callbacks:
                try:
                    callback(data)
                except Exception as err:
                    logger.error("Error executing WebSocket message callback", error=str(err))
                    span.record_exception(err)

