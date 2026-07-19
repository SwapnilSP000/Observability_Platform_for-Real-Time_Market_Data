from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.orders import OrderCreateRequest, OrderResponse, OrderStatus, OrderSide, OrderType

router = APIRouter(prefix="/orders", tags=["Order Management"])


@router.get(
    "",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="List Open Orders (Scaffold)",
    description="Scaffolded endpoint for querying open/historical orders. Trading execution disabled in Phase 2.",
)
async def list_orders() -> List[OrderResponse]:
    return []


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
        detail="Order execution engine disabled during backend foundation phase."
    )
