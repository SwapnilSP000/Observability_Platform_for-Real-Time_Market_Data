from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class BaseExchangeClient(ABC):
    """
    Abstract Base Class defining the contract for any cryptocurrency exchange integration
    (Delta Exchange, Binance, Coinbase, Zerodha, etc.).
    """

    @abstractmethod
    async def get_tickers((self) -> List[Dict[str, Any]]:
        """Fetch real-time market tickers."""
        pass

    @abstractmethod
    async def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """Fetch L2/L3 orderbook depth for a symbol."""
        pass

    @abstractmethod
    async def get_account_balances(self) -> Dict[str, Any]:
        """Fetch account margin and asset balances (Requires Authentication)."""
        pass

    @abstractmethod
    async def check_connectivity(self) -> bool:
        """Health check endpoint to test exchange reachability."""
        pass
