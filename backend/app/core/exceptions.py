from typing import Any, Dict, Optional
from datetime import datetime, timezone
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.app.core.logging import get_logger

logger = get_logger("exceptions")


class DeltaOpsException(Exception):
    """Base exception for all DeltaOps application errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ExchangeAPIError(DeltaOpsException):
    """Raised when Delta Exchange API returns an error response."""

    def __init__(self, message: str, status_code: int = 502, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="EXCHANGE_API_ERROR", status_code=status_code, details=details)


class ExchangeConnectionError(DeltaOpsException):
    """Raised when REST or WebSocket connection to exchange fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="EXCHANGE_CONNECTION_ERROR", status_code=status.HTTP_503_SERVICE_UNAVAILABLE, details=details)


class AuthenticationError(DeltaOpsException):
    """Raised when API key / signature authentication fails."""

    def __init__(self, message: str = "Invalid authentication credentials"):
        super().__init__(message=message, code="AUTHENTICATION_FAILED", status_code=status.HTTP_401_UNAUTHORIZED)


class RateLimitExceededError(DeltaOpsException):
    """Raised when request limits are exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message=message, code="RATE_LIMIT_EXCEEDED", status_code=status.HTTP_429_TOO_MANY_REQUESTS)


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    request: Request,
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """Standardized JSON error response builder."""
    request_id = getattr(request.state, "request_id", "unknown")
    content = {
        "error": {
            "code": code,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requestId": request_id,
            "details": details or {},
        }
    }
    return JSONResponse(status_code=status_code, content=content)


async def deltaops_exception_handler(request: Request, exc: DeltaOpsException) -> JSONResponse:
    """Handler for custom DeltaOps exceptions."""
    logger.error(
        "Application exception occurred",
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
    )
    return create_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        request=request,
        details=exc.details
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler for Pydantic validation errors."""
    logger.warning("Request validation failed", path=request.url.path, errors=exc.errors())
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request payload validation failed",
        request=request,
        details={"validationErrors": exc.errors()}
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handler for generic Starlette/FastAPI HTTP exceptions."""
    logger.warning("HTTP exception occurred", status_code=exc.status_code, detail=exc.detail, path=request.url.path)
    return create_error_response(
        status_code=exc.status_code,
        code="HTTP_ERROR",
        message=str(exc.detail),
        request=request
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled 500 exceptions."""
    logger.critical("Unhandled unexpected exception", error=str(exc), path=request.url.path, exc_info=True)
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal server error occurred",
        request=request
    )
