import hashlib
import hmac
import time
from typing import Dict, Any, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


def generate_delta_signature(
    method: str,
    path: str,
    query_string: str,
    payload: str,
    timestamp: str,
    secret: str
) -> str:
    """
    Generates HMAC-SHA256 signature required by Delta Exchange API.
    Signature string format: METHOD + TIMESTAMP + PATH + QUERY_STRING + PAYLOAD
    Ref: https://docs.delta.exchange/#signing-a-message
    """
    signature_data = f"{method.upper()}{timestamp}{path}{query_string}{payload}"
    return hmac.new(
        secret.encode("utf-8"),
        signature_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to every HTTP response (HSTS, X-Content-Type-Options, etc.).
    """
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


def sanitize_sensitive_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes keys like 'password', 'api_key', 'api_secret', 'token' before logging.
    """
    sensitive_keys = {"password", "api_key", "api_secret", "secret", "token", "authorization"}
    sanitized = {}
    for key, value in data.items():
        if key.lower() in sensitive_keys and isinstance(value, str):
            sanitized[key] = f"{value[:2]}***{value[-2:]}" if len(value) > 4 else "*****"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_sensitive_dict(value)
        else:
            sanitized[key] = value
    return sanitized
