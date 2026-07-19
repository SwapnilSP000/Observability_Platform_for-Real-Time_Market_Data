from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, get_logger
from backend.app.core.telemetry import setup_telemetry
from backend.app.core.security import SecurityHeadersMiddleware
from backend.app.core.exceptions import (
    DeltaOpsException,
    deltaops_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from backend.app.middleware.request_logging import RequestLoggingMiddleware
from backend.app.services.exchange.manager import exchange_manager
from backend.app.api.v1.router import api_v1_router
from backend.app.api.v1.endpoints import health, observability

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager: Startup and Shutdown lifecycle.
    """
    # 1. Startup
    setup_logging()
    setup_telemetry()
    logger.info(
        "Starting DeltaOps Engine Service",
        environment=settings.APP_ENV,
        version=settings.APP_VERSION,
    )
    await exchange_manager.initialize()

    yield

    # 2. Shutdown
    logger.info("Shutting down DeltaOps Engine Service...")
    await exchange_manager.shutdown()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "Enterprise Cryptocurrency Trading Platform API with Full Observability Telemetry.\n\n"
            "**Telemetry Pipeline:**\n"
            "- OpenTelemetry SDK (OTLP gRPC Export)\n"
            "- Prometheus Metrics (`/metrics`)\n"
            "- Loki Structured Logging & Correlation IDs\n"
            "- Jaeger Trace Spans & Graph Topology"
        ),
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS & Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Global Exception Handlers
    app.add_exception_handler(DeltaOpsException, deltaops_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Mount Root Endpoints (/health, /version, /status, /metrics)
    app.include_router(health.router)
    app.include_router(observability.router)

    # Mount API v1 Router (/api/v1/...)
    app.include_router(api_v1_router, prefix="/api")

    return app


app = create_application()
