from fastapi import APIRouter, status
from backend.app.schemas.portfolio import PortfolioSummaryResponse

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get(
    "",
    response_model=PortfolioSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Portfolio Summary (Scaffold)",
    description="Scaffolded endpoint for retrieving portfolio balances, unrealized PnL, and open positions.",
)
async def get_portfolio_summary() -> PortfolioSummaryResponse:
    return PortfolioSummaryResponse(
        totalEquity=25000.0,
        availableMargin=18437.5,
        usedMargin=6562.5,
        unrealizedPnl=4375.0,
        positions=[]
    )
