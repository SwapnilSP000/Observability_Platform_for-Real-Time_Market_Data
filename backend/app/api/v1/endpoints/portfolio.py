import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.portfolio import PortfolioSummaryResponse, PositionSchema, AssetHoldingSchema
from backend.app.services.exchange.manager import exchange_manager
from backend.app.core.logging import get_logger

logger = get_logger("portfolio_endpoint")
router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


def safe_float(val: Any, default: float = 0.0) -> float:
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


@router.get(
    "",
    response_model=PortfolioSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Portfolio Summary",
    description="Retrieves live portfolio balances, unrealized PnL, and open positions directly from Delta Exchange.",
)
async def get_portfolio_summary() -> PortfolioSummaryResponse:
    # --- Step 1: Fetch raw data from Delta Exchange with per-call isolation ---
    raw_balances: List[Dict] = []
    raw_positions: List[Dict] = []
    tickers: List[Dict] = []

    try:
        raw_balances = await exchange_manager.rest_client.get_account_balances()
    except Exception as exc:
        logger.error("Failed to fetch wallet balances from Delta Exchange", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Delta Exchange REST error: {str(exc)}"
        )

    try:
        raw_positions = await exchange_manager.rest_client.get_open_positions()
    except Exception as exc:
        logger.error("Failed to fetch open positions from Delta Exchange", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Delta Exchange REST error: {str(exc)}"
        )

    try:
        tickers = await exchange_manager.rest_client.get_tickers()
    except Exception as exc:
        logger.warning("Failed to fetch tickers from Delta Exchange", error=str(exc))

    # Incorporate cached WS tickers if available
    ws_cached = exchange_manager.get_cached_tickers()
    if ws_cached:
        ws_map = {t.get("symbol"): t for t in ws_cached if t.get("symbol")}
        for idx, t in enumerate(tickers):
            sym = t.get("symbol")
            if sym in ws_map:
                tickers[idx] = {**t, **ws_map[sym]}

    # --- Step 2: Build symbol -> mark_price lookup ---
    ticker_dict: Dict[str, float] = {}
    for t in tickers:
        sym = t.get("symbol")
        if sym:
            mp = safe_float(t.get("mark_price") or t.get("close") or t.get("last_price"))
            if mp > 0.0:
                ticker_dict[sym] = mp

    def get_mark_price(symbol: str) -> Optional[float]:
        for key in (symbol, symbol.upper(), symbol.replace("-PERP", "USD")):
            if key in ticker_dict:
                return ticker_dict[key]
        return None

    # --- Step 3: Parse wallet balances ---
    assets: List[AssetHoldingSchema] = []
    total_balance_usd = 0.0
    available_margin = 0.0
    used_margin = 0.0

    if isinstance(raw_balances, list) and len(raw_balances) > 0:
        for b in raw_balances:
            asset_name = str(b.get("asset_symbol") or b.get("asset") or "").upper()
            if not asset_name:
                continue

            tot = safe_float(b.get("balance"))
            avail = safe_float(b.get("available_balance") or b.get("balance"))
            in_ord = safe_float(b.get("order_margin") or b.get("position_margin"))

            if asset_name in ("USDT", "USD"):
                usd_val = tot
                avail_usd = avail
                in_ord_usd = in_ord
            else:
                mark = get_mark_price(f"{asset_name}USD") or get_mark_price(f"{asset_name}-PERP") or 0.0
                usd_val = tot * mark
                avail_usd = avail * mark
                in_ord_usd = in_ord * mark

            total_balance_usd += usd_val
            available_margin += avail_usd
            used_margin += in_ord_usd

            assets.append(
                AssetHoldingSchema(
                    asset=asset_name,
                    totalBalance=tot,
                    availableBalance=avail,
                    inOrders=in_ord,
                    usdValue=round(usd_val, 2),
                    allocationPercent=0.0,
                )
            )

        if total_balance_usd > 0:
            for a in assets:
                a.allocationPercent = round((a.usdValue / total_balance_usd) * 100.0, 1)

    # --- Step 4: Parse open positions ---
    positions: List[PositionSchema] = []
    unrealized_pnl = 0.0

    # Build a lookup mapping of product_id -> symbol from fetched tickers
    product_id_to_symbol: Dict[int, str] = {}
    if isinstance(tickers, list):
        for t in tickers:
            p_id = t.get("product_id")
            s = t.get("symbol")
            if p_id is not None and s:
                try:
                    product_id_to_symbol[int(p_id)] = str(s)
                except (ValueError, TypeError):
                    continue

    logger.info(
        "Raw positions received from Delta Exchange API",
        raw_count=len(raw_positions) if isinstance(raw_positions, list) else 0
    )

    if isinstance(raw_positions, list) and len(raw_positions) > 0:
        for idx, pos in enumerate(raw_positions):
            try:
                # 1. Resolve product symbol using different possible keys
                sym = pos.get("product_symbol") or pos.get("symbol")
                if not sym and isinstance(pos.get("product"), dict):
                    sym = pos["product"].get("symbol")
                if not sym and pos.get("product_id") is not None:
                    try:
                        sym = product_id_to_symbol.get(int(pos["product_id"]))
                    except (ValueError, TypeError):
                        pass

                sym = str(sym or "").strip()
                if not sym:
                    logger.warning("Skipping position due to unresolved symbol", pos=pos)
                    continue

                size = safe_float(pos.get("size"))
                # Filter out closed positions (size == 0)
                if size == 0:
                    continue

                entry = safe_float(pos.get("entry_price"))
                margin = safe_float(pos.get("position_margin") or pos.get("margin"))
                lev = safe_float(pos.get("leverage") or pos.get("effective_leverage"), 10.0)
                liq = safe_float(pos.get("liquidation_price"))
                upnl = safe_float(pos.get("unrealized_pnl"))
                rpnl = safe_float(pos.get("realized_pnl"))

                unrealized_pnl += upnl
                positions.append(
                    PositionSchema(
                        id=str(pos.get("id") or f"pos_{idx + 1}"),
                        symbol=sym,
                        entryPrice=entry,
                        currentSize=size,
                        margin=margin,
                        leverage=lev,
                        liquidationPrice=liq,
                        unrealizedPnl=upnl,
                        realizedPnl=rpnl,
                    )
                )
            except Exception as exc:
                logger.warning("Failed to parse position entry", error=str(exc), pos=pos)

    logger.info(
        "Positions parsed and filtered",
        parsed_count=len(positions)
    )

    total_equity = round(total_balance_usd + unrealized_pnl, 2)

    logger.info(
        "Portfolio summary computed",
        total_equity=total_equity,
        available_margin=available_margin,
        used_margin=used_margin,
        unrealized_pnl=unrealized_pnl,
        position_count=len(positions),
        asset_count=len(assets),
    )

    return PortfolioSummaryResponse(
        totalEquity=total_equity,
        availableMargin=round(available_margin, 2),
        usedMargin=round(used_margin, 2),
        unrealizedPnl=round(unrealized_pnl, 2),
        positions=positions,
        assets=assets,
    )


@router.get(
    "/positions",
    response_model=List[PositionSchema],
    status_code=status.HTTP_200_OK,
    summary="Get Open Positions",
    description="Retrieves live open positions directly from Delta Exchange (/v2/positions/margined).",
)
async def get_open_positions() -> List[PositionSchema]:
    summary = await get_portfolio_summary()
    return summary.positions
