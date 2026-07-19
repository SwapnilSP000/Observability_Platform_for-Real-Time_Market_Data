from backend.app.core.config import Settings
from backend.app.core.security import generate_delta_signature, sanitize_sensitive_dict


def test_settings_defaults() -> None:
    settings = Settings(APP_ENV="development", DELTA_API_KEY="test_key_1234567890")
    assert settings.APP_NAME == "DeltaOps Engine"
    assert settings.is_production is False
    assert "test...7890" in settings.get_masked_delta_key()


def test_hmac_signature_generation() -> None:
    signature = generate_delta_signature(
        method="GET",
        path="/v2/tickers",
        payload="",
        timestamp="1784507400",
        secret="secret12345"
    )
    assert isinstance(signature, str)
    assert len(signature) == 64  # SHA256 hex string length


def test_sanitize_sensitive_dict() -> None:
    raw_data = {
        "user": "john_doe",
        "api_key": "secret_key_12345",
        "nested": {"password": "super_secret_password"}
    }
    sanitized = sanitize_sensitive_dict(raw_data)
    assert sanitized["user"] == "john_doe"
    assert "secret_key" not in sanitized["api_key"]
    assert "super_secret" not in sanitized["nested"]["password"]
