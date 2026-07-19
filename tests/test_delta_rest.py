import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.exchange.delta_rest import DeltaRESTClient
from backend.app.core.exceptions import ExchangeAPIError


@pytest.mark.asyncio
async def test_delta_rest_client_get_tickers() -> None:
    client = DeltaRESTClient(base_url="https://api.demo.delta.exchange")

    mock_response = {
        "result": [
            {
                "symbol": "BTC-PERP",
                "close": "64250.0",
                "high": "65100.0",
                "low": "63800.0",
                "volume": "120450.5"
            }
        ]
    }

    with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = mock_response
        tickers = await client.get_tickers()
        assert len(tickers) == 1
        assert tickers[0]["symbol"] == "BTC-PERP"
        mock_req.assert_called_once_with("GET", "/v2/tickers")


@pytest.mark.asyncio
async def test_delta_rest_client_orderbook() -> None:
    client = DeltaRESTClient(base_url="https://api.demo.delta.exchange")

    mock_ob = {
        "result": {
            "symbol": "BTC-PERP",
            "bids": [{"price": "64250.0", "size": "1.0"}],
            "asks": [{"price": "64255.0", "size": "0.5"}]
        }
    }

    with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = mock_ob
        ob = await client.get_orderbook("BTC-PERP")
        assert ob["symbol"] == "BTC-PERP"
        assert len(ob["bids"]) == 1
        mock_req.assert_called_once_with("GET", "/v2/l2orderbook/BTC-PERP")
