import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger("http_request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that attaches a unique X-Request-ID header to every request,
    calculates response time, and logs structured request details.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        # Bind context to structlog contextvars for the scope of this request thread
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        start_time = time.perf_counter()

        route = request.scope.get("route")
        endpoint = route.path if route else request.url.path

        try:
            response = await call_next(request)
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Record Prometheus Metrics
            from backend.app.core.telemetry import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS
            HTTP_REQUESTS_TOTAL.labels(method=request.method, endpoint=endpoint, status=response.status_code).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=request.method, endpoint=endpoint).observe(process_time_ms / 1000.0)

            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time-Ms"] = str(process_time_ms)

            logger.info(
                "Request processed",
                status_code=response.status_code,
                duration_ms=process_time_ms,
                latency_ms=process_time_ms,
                client_host=request.client.host if request.client else "unknown",
            )
            return response
        except Exception as exc:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Record Prometheus Metrics
            from backend.app.core.telemetry import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS
            HTTP_REQUESTS_TOTAL.labels(method=request.method, endpoint=endpoint, status=500).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=request.method, endpoint=endpoint).observe(process_time_ms / 1000.0)

            logger.error(
                "Request failed with unhandled exception",
                duration_ms=process_time_ms,
                latency_ms=process_time_ms,
                error=str(exc),
                exc_info=True,
            )
            raise exc
