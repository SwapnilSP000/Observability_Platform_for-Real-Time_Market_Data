from typing import Optional
from backend.app.services.exchange.delta_rest import DeltaRESTClient
from backend.app.services.exchange.delta_ws import DeltaWebSocketClient
from backend.app.core.logging import get_logger

logger = get_logger("exchange_manager")


class ExchangeManager:
    """
    Singleton manager holding active REST and WebSocket exchange client instances.
    """

    def __init__(self) -> None:
        self.rest_client = DeltaRESTClient()
        self.ws_client = DeltaWebSocketClient()

    async def initialize(self) -> None:
        """Initialize background exchange services."""
        logger.info("Initializing Exchange Manager services...")
        await self.ws_client.start()

    async def shutdown(self) -> None:
        """Shutdown background exchange services."""
        logger.info("Shutting down Exchange Manager services...")
        await self.ws_client.stop()


# Global exchange manager singleton
exchange_manager = ExchangeManager()
