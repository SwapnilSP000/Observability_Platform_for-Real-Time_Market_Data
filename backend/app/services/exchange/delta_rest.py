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
        self.api_key = (api_key or settings.DELTA_API_KEY.get_secret_value()).strip()
        self.api_secret = (api_secret or settings.DELTA_API_SECRET.get_secret_value()).strip()
        self.timeout = timeout
        self.max_retries = max_retries
        self.clock_skew_offset = 0.0

    def _build_headers(
        self, method: str, path: str, query_string: str = "", payload_str: str = ""
    ) -> Dict[str, str]:
        """Constructs headers including HMAC-SHA256 signature if credentials are set."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"DeltaOps/{settings.APP_VERSION}",
        }

        if self.api_key and self.api_secret:
            timestamp = str(int(time.time() + self.clock_skew_offset))
            signature = generate_delta_signature(
                method=method,
                path=path,
                query_string=query_string,
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
        candidates = [self.base_url]
        base_urls = []
        for c in candidates:
            if c and c not in base_urls:
                base_urls.append(c)

        payload_str = ""
        if json_data:
            import json
            payload_str = json.dumps(json_data)

        # Build query string separately — both needed for correct HMAC signature
        query_string = ""
        if params:
            from urllib.parse import urlencode
            query_string = f"?{urlencode(params)}"

        last_error = None
        for b_url in base_urls:
            url = f"{b_url.rstrip('/')}{path}"
            headers = self._build_headers(method, path, query_string, payload_str)
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
                        # Success: remember working base_url
                        self.base_url = b_url
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

                    # If 401/403/404 on current domain, break retry loop to try alternate base_url
                    if response.status_code in (401, 403, 404) and len(base_urls) > 1 and b_url != base_urls[-1]:
                        logger.info("Auth/Route error on domain, trying alternate base_url", current_url=url, status=response.status_code)
                        last_error = ExchangeAPIError(
                            message=f"Delta Exchange API returned HTTP {response.status_code}: {response.text[:200]}",
                            status_code=response.status_code,
                            details={"path": path, "statusCode": response.status_code},
                        )
                        break

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
                    last_error = ExchangeConnectionError(
                        message=f"Failed to connect to Delta Exchange after {self.max_retries} attempts: {str(err)}"
                    )
                    break

        if last_error:
            raise last_error
        raise ExchangeAPIError("Maximum retries exceeded")

    async def get_tickers(self) -> List[Dict[str, Any]]:
        """Fetch all tickers from Delta Exchange (/v2/tickers)."""
        response = await self._request("GET", "/v2/tickers")
        return response.get("result", [])

    async def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """Fetch orderbook depth for a specific symbol (/v2/l2orderbook/<symbol>)."""
        response = await self._request("GET", f"/v2/l2orderbook/{symbol}")
        return response.get("result", {})

    async def get_account_balances(self) -> List[Dict[str, Any]]:
        """Fetch account balances (Requires valid API key & secret)."""
        response = await self._request("GET", "/v2/wallet/balances", authenticated=True)
        res = response.get("result", [])
        return res if isinstance(res, list) else []

    async def get_open_positions(self) -> List[Dict[str, Any]]:
        """Fetch open margined positions from Delta Exchange (/v2/positions/margined)."""
        response = await self._request("GET", "/v2/positions/margined", authenticated=True)
        return response.get("result", [])

    async def get_orders(self) -> List[Dict[str, Any]]:
        """Fetch open orders from Delta Exchange (/v2/orders)."""
        response = await self._request("GET", "/v2/orders", params={"state": "open"}, authenticated=True)
        return response.get("result", [])

    async def get_order_history(self) -> List[Dict[str, Any]]:
        """Fetch order history from Delta Exchange (/v2/orders/history)."""
        response = await self._request("GET", "/v2/orders/history", authenticated=True)
        return response.get("result", [])

    async def get_server_time(self) -> int:
        """Fetch server time in milliseconds from Delta Exchange (/v2/time)."""
        # Call directly using httpx.AsyncClient to avoid chicken-and-egg signature/time issues
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/v2/time")
            if response.status_code != 200:
                raise ExchangeAPIError(
                    f"Could not fetch server time: HTTP {response.status_code}",
                    status_code=response.status_code
                )
            return response.json().get("result", {}).get("time", 0)

    async def sync_clock(self) -> None:
        """
        Verifies local clock alignment with Delta Exchange server.
        Raises RuntimeError if local time deviates by more than 30s.
        """
        try:
            server_time_ms = await self.get_server_time()
            local_time_ms = int(time.time() * 1000)
            skew_seconds = abs(local_time_ms - server_time_ms) / 1000.0

            if skew_seconds > 30.0:
                logger.error(
                    "NTP synchronization error: Local clock deviates from Delta Exchange server by more than 30 seconds",
                    skew_seconds=skew_seconds,
                    local_time_ms=local_time_ms,
                    server_time_ms=server_time_ms
                )
                raise RuntimeError(
                    f"NTP synchronization error: clock skew is {skew_seconds:.2f}s (max allowed: 30s). Please sync your system time."
                )

            self.clock_skew_offset = (server_time_ms - local_time_ms) / 1000.0
            logger.info("Clock skew check passed", skew_seconds=skew_seconds, offset_seconds=self.clock_skew_offset)
        except Exception as exc:
            if isinstance(exc, RuntimeError):
                raise exc
            logger.warning("Failed to sync clock with Delta server, defaulting to zero offset", error=str(exc))
            self.clock_skew_offset = 0.0

    async def check_connectivity(self) -> bool:
        """Tests connectivity to Delta Exchange API."""
        try:
            res = await self._request("GET", "/v2/tickers")
            return "result" in res or "success" in res
        except Exception as err:
            logger.error("Delta Exchange reachability check failed", error=str(err))
            return False
