from fastapi import APIRouter
from backend.app.api.v1.endpoints import market, orders, portfolio, websocket

api_v1_router = APIRouter(prefix="/v1")

# health and observability routers are mounted at root level in main.py
# they are NOT included here to avoid duplicate routes
api_v1_router.include_router(market.router)
api_v1_router.include_router(orders.router)
api_v1_router.include_router(portfolio.router)
api_v1_router.include_router(websocket.router)
