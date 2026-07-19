from typing import List
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings loaded from environment variables or .env file.
    All sensitive credentials use SecretStr to prevent accidental logging.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    # Core Application Configuration
    APP_NAME: str = "DeltaOps Engine"
    APP_ENV: str = "development"
    APP_VERSION: str = "0.1.0-alpha"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: SecretStr = Field(
        default=SecretStr("CHANGE_THIS_IN_PRODUCTION_32_CHAR_SECRET_KEY_MIN")
    )

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Delta Exchange Configuration (Targeting Demo / Testnet)
    DELTA_BASE_URL: str = "https://api.demo.delta.exchange"
    DELTA_WS_URL: str = "wss://socket.demo.delta.exchange"
    DELTA_API_KEY: SecretStr = Field(default=SecretStr(""))
    DELTA_API_SECRET: SecretStr = Field(default=SecretStr(""))

    # HTTP Client Timeouts & Retries
    REST_TIMEOUT_SECONDS: float = 10.0
    REST_MAX_RETRIES: int = 3

    # Database & Cache Settings (Future Preparation)
    DATABASE_URL: SecretStr = Field(
        default=SecretStr("postgresql+asyncpg://deltaops_user:password@localhost:5432/deltaops_db")
    )
    REDIS_URL: SecretStr = Field(
        default=SecretStr("redis://:password@localhost:6379/0")
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    def get_masked_delta_key(self) -> str:
        """Returns masked API key for safe health checks (e.g. 'AB59...89Y8')."""
        key_str = self.DELTA_API_KEY.get_secret_value()
        if not key_str or len(key_str) < 8:
            return "NOT_CONFIGURED" if not key_str else "KEY_TOO_SHORT"
        return f"{key_str[:4]}...{key_str[-4:]}"


# Global singleton settings instance
settings = Settings()
