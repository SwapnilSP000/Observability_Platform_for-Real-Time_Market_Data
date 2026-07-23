from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    appName: str = Field(..., json_schema_extra={"example": "DeltaOps Engine"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    version: str = Field(..., json_schema_extra={"example": "0.1.0-alpha"})
    timestamp: datetime


class VersionResponse(BaseModel):
    appName: str = Field(..., json_schema_extra={"example": "DeltaOps Engine"})
    version: str = Field(..., json_schema_extra={"example": "0.1.0-alpha"})
    pythonVersion: str = Field(..., json_schema_extra={"example": "3.11.8"})
    environment: str = Field(..., json_schema_extra={"example": "development"})


class StatusResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "operational"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    exchangeConnectivity: Dict[str, Any] = Field(
        ...,
        json_schema_extra={
            "example": {
                "deltaExchange": {
                    "restUrl": "https://api.demo.delta.exchange",
                    "wsUrl": "wss://socket.demo.delta.exchange",
                    "apiKeyConfigured": True,
                    "maskedApiKey": "AB59...89Y8",
                    "reachable": True,
                }
            }
        },
    )
    webSocketState: Dict[str, Any] = Field(
        ...,
        json_schema_extra={
            "example": {
                "connected": True,
                "activeSubscriptions": ["v2/ticker", "l2_orderbook"],
                "reconnectAttempts": 0,
            }
        },
    )
    timestamp: datetime
