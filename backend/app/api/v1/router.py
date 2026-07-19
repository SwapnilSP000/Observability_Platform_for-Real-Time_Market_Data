from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, market, orders, portfolio, websocket, observability

api_v1_router = APIRouter(prefix="/v1")

api_v1_router.include_router(health.router)
api_v1_router.include_router(market.router)
api_v1_router.include_router(orders.router)
api_v1_router.include_router(portfolio.router)
api_v1_router.include_router(websocket.router)
api_v1_router.include_router(observability.router)
