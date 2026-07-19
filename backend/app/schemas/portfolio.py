from typing import List, Optional
from pydantic import BaseModel, Field


class PositionSchema(BaseModel):
    id: str = Field(..., example="pos_01")
    symbol: str = Field(..., example="BTC-PERP")
    entryPrice: float = Field(..., example=62500.0)
    currentSize: float = Field(..., example=2.5)
    margin: float = Field(..., example=1562.5)
    leverage: float = Field(..., example=10.0)
    liquidationPrice: float = Field(..., example=56250.0)
    unrealizedPnl: float = Field(..., example=4375.0)
    realizedPnl: float = Field(..., example=120.5)


class PortfolioSummaryResponse(BaseModel):
    totalEquity: float = Field(..., example=25000.0)
    availableMargin: float = Field(..., example=18437.5)
    usedMargin: float = Field(..., example=6562.5)
    unrealizedPnl: float = Field(..., example=4375.0)
    positions: List[PositionSchema] = Field(default_factory=list)
