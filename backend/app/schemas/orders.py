from typing import Optional, List
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    LIMIT = "limit_order"
    MARKET = "market_order"
    STOP_MARKET = "stop_market_order"


class OrderStatus(str, Enum):
    CREATED = "created"
    PENDING_SUBMIT = "pending_submit"
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderCreateRequest(BaseModel):
    product_id: int = Field(..., example=27, description="Delta Exchange Product ID")
    symbol: str = Field(..., example="BTC-PERP")
    side: OrderSide = Field(..., example=OrderSide.BUY)
    order_type: OrderType = Field(..., example=OrderType.LIMIT)
    limit_price: Optional[float] = Field(None, example=64000.0)
    size: float = Field(..., gt=0, example=1.0)
    post_only: bool = Field(False, example=False)


class OrderResponse(BaseModel):
    id: str = Field(..., example="ord_8f12a4b")
    external_order_id: Optional[str] = Field(None, example="198273645")
    symbol: str = Field(..., example="BTC-PERP")
    side: OrderSide
    order_type: OrderType
    price: float = Field(..., example=64000.0)
    size: float = Field(..., example=1.0)
    filled_size: float = Field(0.0, example=0.0)
    status: OrderStatus = Field(..., example=OrderStatus.OPEN)
    created_at: datetime
