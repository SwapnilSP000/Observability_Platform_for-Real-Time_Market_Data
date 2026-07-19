import time
import asyncio
from typing import Dict, Any, List, Optional
import httpx
from backend.app.core.config import settings
from backend.app.core.security import generate_delta_signature
from backend.app.core.exceptions import ExchangeAPIError, ExchangeConnectionError
from backend.app.core.logging import get_logger
from backend.app.services.exchange.base import BaseExchangeClient

logger = get_logger("delta_rest")


class DeltaRESTClient(BaseExchangeClient):
    """
    Asynchronous REST client for Delta Exchange API.
    Handles HMAC authentication, retries with exponential backoff, timeouts, and error handling.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        timeout: float = 10.0,
        max_retries: int = 3,
    ):
        self.base_url = (base_url or settings.DELTA_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.DELTA_API_KEY.get_secret_value()
        self.api_secret = api_secret or settings.DELTA_API_SECRET.get_secret_value()
        self.timeout = timeout
        self.max_retries = max_retries

    def _build_headers(
        self, method: str, path: str, payload_str: str = ""
    ) -> Dict[str, str]:
        """Constructs headers including HMAC-SHA256 signature if credentials are set."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"DeltaOps/{settings.APP_VERSION}",
        }

        if self.api_key and self.api_secret:
            timestamp = str(int(time.time()))
            signature = generate_delta_signature(
                method=method,
                path=path,
                payload=payload_str,
                timestamp=timestamp,
                secret=self.api_secret,
            )
            headers["api-key"] = self.api_key
            headers["signature"] = signature
            headers["timestamp"] = timestamp

        return headers

    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        authenticated: bool = False,
    ) -> Dict[str, Any]:
        """Core async request execution wrapper with exponential backoff retry."""
        url = f"{self.base_url}{path}"
        payload_str = ""
        if json_data:
            import json
            payload_str = json.dumps(json_data)

        headers = self._build_headers(method, path, payload_str)

        attempt = 0
        backoff = 0.5

        while attempt <= self.max_retries:
            attempt += 1
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        params=params,
                        json=json_data,
                        headers=headers,
                    )

                if response.status_code == 200:
                    return response.json()

                if response.status_code in (429, 502, 503, 504) and attempt <= self.max_retries:
                    logger.warning(
                        "Transient exchange error, retrying",
                        status_code=response.status_code,
                        attempt=attempt,
                        backoff_seconds=backoff,
                    )
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue

                # Raise structured exception for non-200 responses
                error_body = response.text
                raise ExchangeAPIError(
                    message=f"Delta Exchange API returned HTTP {response.status_code}: {error_body[:200]}",
                    status_code=response.status_code,
                    details={"path": path, "statusCode": response.status_code},
                )

            except (httpx.TimeoutException, httpx.NetworkError) as err:
                if attempt <= self.max_retries:
                    logger.warning("Network timeout/error, retrying", error=str(err), attempt=attempt)
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue
                raise ExchangeConnectionError(
                    message=f"Failed to connect to Delta Exchange after {self.max_retries} attempts: {str(err)}"
                )

        raise ExchangeAPIError("Maximum retries exceeded")

    async def get_tickers(self) -> List[Dict[str, Any]]:
        """Fetch all tickers from Delta Exchange (/v2/tickers)."""
        response = await self._request("GET", "/v2/tickers")
        return response.get("result", [])

    async def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """Fetch orderbook depth for a specific symbol (/v2/l2orderbook/<symbol>)."""
        response = await self._request("GET", f"/v2/l2orderbook/{symbol}")
        return response.get("result", {})

    async def get_account_balances(self) -> Dict[str, Any]:
        """Fetch account balances (Requires valid API key & secret)."""
        response = await self._request("GET", "/v2/wallet/balances", authenticated=True)
        return response.get("result", {})

    async def check_connectivity(self) -> bool:
        """Tests connectivity to Delta Exchange API."""
        try:
            res = await self._request("GET", "/v2/tickers")
            return "result" in res
        except Exception as err:
            logger.error("Delta Exchange reachability check failed", error=str(err))
            return False
