import logging
import sys
import time
import json
import structlog
from opentelemetry import trace
from backend.app.core.config import settings

# Standard keys that are present in LogRecord by default, which we don't want to duplicate in Loki logs
STANDARD_RECORD_KEYS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message"
}

class LokiJSONFormatter(logging.Formatter):
    """
    Standard Python logging formatter that formats records as Loki-compatible JSON strings.
    Ensures inclusion of trace_id, span_id, timestamp, level, service, event, latency_ms, and symbol.
    """
    def format(self, record: logging.LogRecord) -> str:
        # Get current OTel span context
        span = trace.get_current_span()
        trace_id = ""
        span_id = ""
        if span and span.get_span_context().is_valid:
            span_context = span.get_span_context()
            trace_id = trace.format_trace_id(span_context.trace_id)
            span_id = trace.format_span_id(span_context.span_id)

        # Standard ISO timestamp with milliseconds
        created = record.created
        iso_timestamp = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(created)) + f".{int((created - int(created)) * 1000):03d}Z"

        # Construct log dict
        log_data = {
            "timestamp": iso_timestamp,
            "level": record.levelname,
            "service": getattr(record, "service", record.name or "deltaops"),
            "event": record.getMessage(),
            "latency_ms": getattr(record, "latency_ms", None),
            "symbol": getattr(record, "symbol", None),
            "trace_id": trace_id,
            "span_id": span_id,
        }

        # Extract exception formatting
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Extract extra fields passed to logger (including those from structlog)
        for key, val in record.__dict__.items():
            if key not in STANDARD_RECORD_KEYS and not key.startswith("_"):
                # Special fields we map directly or keep
                if key == "duration_ms" and log_data["latency_ms"] is None:
                    log_data["latency_ms"] = val
                log_data[key] = val

        # Handle direct structlog dictionary passing in record.msg
        if isinstance(record.msg, dict):
            msg_dict = record.msg
            log_data.update(msg_dict)
            if "event" in msg_dict:
                log_data["event"] = msg_dict["event"]
            if "duration_ms" in msg_dict and log_data["latency_ms"] is None:
                log_data["latency_ms"] = msg_dict["duration_ms"]

        # Guarantee critical keys exist
        for key in ["latency_ms", "symbol"]:
            if key not in log_data:
                log_data[key] = None

        return json.dumps(log_data)


def setup_logging() -> None:
    """
    Configures the root logging logger and structlog to output valid JSON lines to stdout.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure root standard library logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove all existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create stream handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(LokiJSONFormatter())
    root_logger.addHandler(stream_handler)

    # Configure structlog to format and delegate to standard library logging
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.render_to_log_kwargs,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "deltaops") -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)
