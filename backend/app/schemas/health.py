from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    appName: str = Field(..., example="DeltaOps Engine")
    environment: str = Field(..., example="development")
    version: str = Field(..., example="0.1.0-alpha")
    timestamp: datetime


class VersionResponse(BaseModel):
    appName: str = Field(..., example="DeltaOps Engine")
    version: str = Field(..., example="0.1.0-alpha")
    pythonVersion: str = Field(..., example="3.11.8")
    environment: str = Field(..., example="development")


class StatusResponse(BaseModel):
    status: str = Field(..., example="operational")
    environment: str = Field(..., example="development")
    exchangeConnectivity: Dict[str, Any] = Field(
        ...,
        example={
            "deltaExchange": {
                "restUrl": "https://api.demo.delta.exchange",
                "wsUrl": "wss://socket.demo.delta.exchange",
                "apiKeyConfigured": True,
                "maskedApiKey": "AB59...89Y8",
                "reachable": True
            }
        }
    )
    webSocketState: Dict[str, Any] = Field(
        ...,
        example={
            "connected": True,
            "activeSubscriptions": ["v2/ticker", "l2_orderbook"],
            "reconnectAttempts": 0
        }
    )
    timestamp: datetime
