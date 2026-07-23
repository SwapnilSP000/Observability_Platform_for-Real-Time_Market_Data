from typing import List, Optional, Any
from fastapi import APIRouter, status
from backend.app.schemas.market import MarketListResponse, TickerSchema, OrderBookSchema
from backend.app.services.exchange.manager import exchange_manager
from backend.app.core.logging import get_logger

logger = get_logger("market_endpoint")
router = APIRouter(prefix="/market", tags=["Market Data"])


def safe_float(val: Any) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


@router.get(
    "/tickers",
    response_model=MarketListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Real-Time Market Tickers",
    description="Fetches current price tickers and 24h stats for active products on Delta Exchange.",
)
async def get_market_tickers() -> MarketListResponse:
    from backend.app.core.telemetry import MARKET_REQUESTS_TOTAL
    MARKET_REQUESTS_TOTAL.labels(symbol="ALL", endpoint_type="REST_TICKERS").inc()
    try:
        tickers_data = await exchange_manager.rest_client.get_tickers()
    except Exception as exc:
        logger.warning("REST ticker fetch failed, using cached WS tickers", error=str(exc))
        tickers_data = []

    # Merge WS cached tickers
    ws_cached = exchange_manager.get_cached_tickers()
    if ws_cached:
        ws_map = {t.get("symbol"): t for t in ws_cached if t.get("symbol")}
        for idx, t in enumerate(tickers_data):
            sym = t.get("symbol")
            if sym in ws_map:
                tickers_data[idx] = {**t, **ws_map[sym]}
        # Add any WS tickers not present in REST
        existing_syms = {t.get("symbol") for t in tickers_data}
        for ws_sym, ws_t in ws_map.items():
            if ws_sym not in existing_syms:
                tickers_data.append(ws_t)

    parsed_tickers: List[TickerSchema] = []
    for t in tickers_data:
        sym = str(t.get("symbol", "UNKNOWN"))

        # Use raw values from Delta Exchange — never apply artificial offsets
        mark_p = safe_float(t.get("mark_price")) or safe_float(t.get("close")) or safe_float(t.get("last_price"))
        close_p = safe_float(t.get("close")) or safe_float(t.get("last_price")) or safe_float(t.get("mark_price"))
        open_p = safe_float(t.get("open")) or safe_float(t.get("open_price"))

        # Compute 24h change from open/close if not provided by API
        chg = safe_float(t.get("price_change_24h")) or safe_float(t.get("change_24h")) or safe_float(t.get("change"))
        if chg is None and close_p is not None and open_p is not None and open_p > 0:
            chg = round(((close_p - open_p) / open_p) * 100.0, 2)

        parsed_tickers.append(
            TickerSchema(
                symbol=sym,
                close=close_p,
                high=safe_float(t.get("high")),
                low=safe_float(t.get("low")),
                volume=safe_float(t.get("volume")) or safe_float(t.get("turnover_usd")),
                openInterest=safe_float(t.get("open_interest")),
                markPrice=mark_p,
                fundingRate=safe_float(t.get("funding_rate")),
                change24h=chg,
            )
        )

    logger.info("Market tickers fetched from Delta Exchange", count=len(parsed_tickers))
    return MarketListResponse(count=len(parsed_tickers), tickers=parsed_tickers)


@router.get(
    "/orderbook/{symbol}",
    response_model=OrderBookSchema,
    status_code=status.HTTP_200_OK,
    summary="Get Orderbook Depth",
    description="Retrieves L2 orderbook bids and asks for a specified market symbol (e.g. BTCUSD).",
)
async def get_market_orderbook(symbol: str) -> OrderBookSchema:
    # Normalize symbol: BTC-PERP -> BTCUSD, ensure uppercase
    clean_symbol = symbol.upper().replace("-PERP", "USD")

    from backend.app.core.telemetry import MARKET_REQUESTS_TOTAL
    MARKET_REQUESTS_TOTAL.labels(symbol=clean_symbol, endpoint_type="REST_ORDERBOOK").inc()

    ob_data = await exchange_manager.rest_client.get_orderbook(clean_symbol)

    bids = []
    asks = []
    if ob_data and isinstance(ob_data, dict):
        raw_bids = ob_data.get("buy") or ob_data.get("bids") or []
        raw_asks = ob_data.get("sell") or ob_data.get("asks") or []
        bids = [{"price": float(b["limit_price"] if "limit_price" in b else b["price"]), "size": float(b["size"])} for b in raw_bids]
        asks = [{"price": float(a["limit_price"] if "limit_price" in a else a["price"]), "size": float(a["size"])} for a in raw_asks]

    logger.info("Orderbook fetched", symbol=clean_symbol, bids=len(bids), asks=len(asks))

    return OrderBookSchema(
        symbol=clean_symbol,
        bids=bids,
        asks=asks,
        timestamp=ob_data.get("timestamp") if ob_data else None,
    )
