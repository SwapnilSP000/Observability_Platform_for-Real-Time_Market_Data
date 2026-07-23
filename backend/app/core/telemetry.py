import os
import time
import contextlib
import time as _time
from typing import Optional
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from backend.app.core.config import settings
from backend.app.core.logging import get_logger

logger = get_logger("telemetry")

# 1. Prometheus Metrics Definitions
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests received",
    ["method", "endpoint", "status"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency histogram in seconds",
    ["method", "endpoint"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

ACTIVE_WEBSOCKET_CONNECTIONS = Gauge(
    "active_websocket_connections",
    "Active client and exchange WebSocket connections"
)

MARKET_REQUESTS_TOTAL = Counter(
    "market_requests_total",
    "Total market data requests and WebSocket tick messages processed",
    ["symbol", "endpoint_type"]
)

DELTA_API_LATENCY_SECONDS = Histogram(
    "delta_api_latency_seconds",
    "Delta Exchange REST API request duration in seconds",
    ["endpoint"]
)

# Initialize default values
ACTIVE_WEBSOCKET_CONNECTIONS.set(0)


@contextlib.contextmanager
def record_delta_latency(endpoint: str):
    """Context manager to time Delta Exchange REST calls and record to histogram."""
    start = _time.perf_counter()
    try:
        yield
    finally:
        elapsed = _time.perf_counter() - start
        DELTA_API_LATENCY_SECONDS.labels(endpoint=endpoint).observe(elapsed)


# 2. OpenTelemetry Initialization
def setup_telemetry() -> Optional[trace.Tracer]:
    """
    Initializes OpenTelemetry SDK with OTLP gRPC exporter.
    """
    try:
        resource = Resource.create(attributes={"service.name": settings.APP_NAME})
        provider = TracerProvider(resource=resource)
        # Export to the OTel Collector which forwards to Jaeger
        _otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")
        _exporter = OTLPSpanExporter(endpoint=_otlp_endpoint, insecure=True)
        processor = BatchSpanProcessor(_exporter)
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        logger.info("OpenTelemetry SDK initialized with OTLP gRPC collector exporter", endpoint=_otlp_endpoint)
        return trace.get_tracer(settings.APP_NAME)
    except Exception as err:
        logger.warning("Failed to initialize OpenTelemetry exporter, falling back to no-op tracer", error=str(err))
        return trace.get_tracer(settings.APP_NAME)


def get_prometheus_metrics() -> bytes:
    """Generates latest Prometheus format metrics response."""
    return generate_latest()
