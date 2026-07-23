from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.orders import OrderCreateRequest, OrderResponse, OrderStatus, OrderSide, OrderType
from backend.app.services.exchange.manager import exchange_manager
from backend.app.core.logging import get_logger

logger = get_logger("orders_endpoint")
router = APIRouter(prefix="/orders", tags=["Order Management"])


def safe_float(val: Any) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def parse_order_side(side: str) -> OrderSide:
    return OrderSide.BUY if str(side).lower() in ("buy", "long") else OrderSide.SELL


def parse_order_type(order_type: str) -> OrderType:
    t = str(order_type).lower()
    if t in ("market", "market_order"):
        return OrderType.MARKET
    if t in ("stop", "stop_loss", "stop_market", "stop_loss_market"):
        return OrderType.STOP_MARKET
    return OrderType.LIMIT


def parse_order_status(state: str) -> OrderStatus:
    s = str(state).lower()
    if s in ("filled", "done", "closed"):
        return OrderStatus.FILLED
    if s in ("cancelled", "canceled"):
        return OrderStatus.CANCELLED
    return OrderStatus.OPEN


@router.get(
    "",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="List Account Orders",
    description="Retrieves live open orders from Delta Exchange (/v2/orders?state=open).",
)
async def list_orders() -> List[OrderResponse]:
    try:
        raw_orders = await exchange_manager.rest_client.get_orders()
    except Exception as exc:
        logger.error("Failed to fetch open orders from Delta Exchange", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Delta Exchange REST error: {str(exc)}"
        )

    result: List[OrderResponse] = []
    for idx, o in enumerate(raw_orders):
        try:
            sym = str(o.get("product_symbol") or o.get("symbol") or "UNKNOWN")
            side = parse_order_side(str(o.get("side") or "buy"))
            otype = parse_order_type(str(o.get("order_type") or "limit"))
            ostatus = parse_order_status(str(o.get("state") or o.get("status") or "open"))
            price = safe_float(o.get("limit_price") or o.get("price") or o.get("stop_price") or 0.0) or 0.0
            size = safe_float(o.get("size") or o.get("unfilled_size") or 0.0) or 0.0
            filled = safe_float(o.get("filled_size") or o.get("size_filled") or 0.0) or 0.0

            created_raw = o.get("created_at") or o.get("created_timestamp")
            if created_raw:
                try:
                    created_at = datetime.fromisoformat(str(created_raw).replace("Z", "+00:00"))
                except Exception:
                    created_at = datetime.now(timezone.utc)
            else:
                created_at = datetime.now(timezone.utc)

            result.append(
                OrderResponse(
                    id=str(o.get("id") or f"ord_{idx + 1}"),
                    external_order_id=str(o.get("client_order_id") or o.get("order_id") or ""),
                    symbol=sym,
                    side=side,
                    order_type=otype,
                    price=price,
                    size=size,
                    filled_size=filled,
                    status=ostatus,
                    created_at=created_at,
                )
            )
        except Exception as exc:
            logger.warning("Failed to parse order entry", error=str(exc), order=o)

    logger.info("Orders fetched from Delta Exchange", count=len(result))
    return result


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    summary="Create Order (Scaffold)",
    description="Scaffolded endpoint for order placement. Real execution engine will be activated in Phase 4.",
)
async def create_order(order_req: OrderCreateRequest) -> OrderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Order execution engine disabled during backend foundation phase.",
    )
