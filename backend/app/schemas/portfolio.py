from typing import List, Optional
from pydantic import BaseModel, Field


class PositionSchema(BaseModel):
    id: str = Field(..., json_schema_extra={"example": "pos_01"})
    symbol: str = Field(..., json_schema_extra={"example": "BTC-PERP"})
    entryPrice: float = Field(..., json_schema_extra={"example": 62500.0})
    currentSize: float = Field(..., json_schema_extra={"example": 2.5})
    margin: float = Field(..., json_schema_extra={"example": 1562.5})
    leverage: float = Field(..., json_schema_extra={"example": 10.0})
    liquidationPrice: float = Field(..., json_schema_extra={"example": 56250.0})
    unrealizedPnl: float = Field(..., json_schema_extra={"example": 4375.0})
    realizedPnl: float = Field(..., json_schema_extra={"example": 120.5})


class AssetHoldingSchema(BaseModel):
    asset: str = Field(..., json_schema_extra={"example": "USDT"})
    totalBalance: float = Field(..., json_schema_extra={"example": 15000.0})
    availableBalance: float = Field(..., json_schema_extra={"example": 12000.0})
    inOrders: float = Field(..., json_schema_extra={"example": 3000.0})
    usdValue: float = Field(..., json_schema_extra={"example": 15000.0})
    allocationPercent: float = Field(..., json_schema_extra={"example": 60.0})


class PortfolioSummaryResponse(BaseModel):
    totalEquity: float = Field(..., json_schema_extra={"example": 25000.0})
    availableMargin: float = Field(..., json_schema_extra={"example": 18437.5})
    usedMargin: float = Field(..., json_schema_extra={"example": 6562.5})
    unrealizedPnl: float = Field(..., json_schema_extra={"example": 4375.0})
    positions: List[PositionSchema] = Field(default_factory=list)
    assets: List[AssetHoldingSchema] = Field(default_factory=list)
