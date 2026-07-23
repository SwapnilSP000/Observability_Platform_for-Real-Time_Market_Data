from typing import Optional
from backend.app.services.exchange.delta_rest import DeltaRESTClient
from backend.app.services.exchange.delta_ws import DeltaWebSocketClient
from backend.app.core.logging import get_logger

logger = get_logger("exchange_manager")


class ExchangeManager:
    """
    Singleton manager holding active REST and WebSocket exchange client instances.
    Includes in-memory ticker cache fed by WebSocket stream for zero-latency real-time updates.
    """

    def __init__(self) -> None:
        self.rest_client = DeltaRESTClient()
        self.ws_client = DeltaWebSocketClient()
        self.ticker_cache: dict = {}

    def update_ticker_cache(self, ticker_data: dict) -> None:
        """Update live ticker cache from WebSocket stream frames."""
        symbol = ticker_data.get("symbol")
        if symbol:
            self.ticker_cache[symbol] = {**self.ticker_cache.get(symbol, {}), **ticker_data}

    def get_cached_tickers(self) -> list:
        """Returns list of cached real-time tickers."""
        return list(self.ticker_cache.values())

    async def initialize(self) -> None:
        """Initialize background exchange services."""
        logger.info("Initializing Exchange Manager services...")
        await self.rest_client.sync_clock()
        await self.ws_client.start()

    async def shutdown(self) -> None:
        """Shutdown background exchange services."""
        logger.info("Shutting down Exchange Manager services...")
        await self.ws_client.stop()


# Global exchange manager singleton
exchange_manager = ExchangeManager()

