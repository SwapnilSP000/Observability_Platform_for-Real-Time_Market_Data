from typing import List, Optional
from pydantic import BaseModel, Field


class TickerSchema(BaseModel):
    symbol: str = Field(..., example="BTC-PERP")
    close: Optional[float] = Field(None, example=64250.0)
    high: Optional[float] = Field(None, example=65100.0)
    low: Optional[float] = Field(None, example=63800.0)
    volume: Optional[float] = Field(None, example=120450.5)
    openInterest: Optional[float] = Field(None, example=45000.0)
    markPrice: Optional[float] = Field(None, example=64255.2)
    fundingRate: Optional[float] = Field(None, example=0.0001)


class OrderBookLevel(BaseModel):
    price: float = Field(..., example=64250.0)
    size: float = Field(..., example=1.25)


class OrderBookSchema(BaseModel):
    symbol: str = Field(..., example="BTC-PERP")
    bids: List[OrderBookLevel] = Field(default_factory=list)
    asks: List[OrderBookLevel] = Field(default_factory=list)
    timestamp: Optional[int] = Field(None, example=1784507400000)


class MarketListResponse(BaseModel):
    count: int
    tickers: List[TickerSchema]
