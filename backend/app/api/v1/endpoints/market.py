from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from backend.app.schemas.market import MarketListResponse, TickerSchema, OrderBookSchema
from backend.app.services.exchange.manager import exchange_manager

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get(
    "/tickers",
    response_model=MarketListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Real-Time Market Tickers",
    description="Fetches current price tickers and 24h stats for active products on Delta Exchange.",
)
async def get_market_tickers() -> MarketListResponse:
    tickers_data = await exchange_manager.rest_client.get_tickers()

    parsed_tickers: List[TickerSchema] = []
    for t in tickers_data:
        parsed_tickers.append(
            TickerSchema(
                symbol=t.get("symbol", "UNKNOWN"),
                close=float(t.get("close", 0)) if t.get("close") else None,
                high=float(t.get("high", 0)) if t.get("high") else None,
                low=float(t.get("low", 0)) if t.get("low") else None,
                volume=float(t.get("volume", 0)) if t.get("volume") else None,
                openInterest=float(t.get("open_interest", 0)) if t.get("open_interest") else None,
                markPrice=float(t.get("mark_price", 0)) if t.get("mark_price") else None,
                fundingRate=float(t.get("funding_rate", 0)) if t.get("funding_rate") else None,
            )
        )

    return MarketListResponse(count=len(parsed_tickers), tickers=parsed_tickers)


@router.get(
    "/orderbook/{symbol}",
    response_model=OrderBookSchema,
    status_code=status.HTTP_200_OK,
    summary="Get Orderbook Depth",
    description="Retrieves L2 orderbook bids and asks for a specified market symbol (e.g. BTC-PERP).",
)
async def get_market_orderbook(symbol: str) -> OrderBookSchema:
    ob_data = await exchange_manager.rest_client.get_orderbook(symbol)
    if not ob_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orderbook data for symbol '{symbol}' not found"
        )

    bids = [{"price": float(b["price"]), "size": float(b["size"])} for b in ob_data.get("bids", [])]
    asks = [{"price": float(a["price"]), "size": float(a["size"])} for a in ob_data.get("asks", [])]

    return OrderBookSchema(
        symbol=symbol.upper(),
        bids=bids,
        asks=asks,
        timestamp=ob_data.get("timestamp")
    )
