import os
import sys
import time
import json
import httpx
import hmac
import hashlib

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.config import settings

def generate_signature(method: str, path: str, payload: str, timestamp: str, secret: str) -> str:
    signature_data = f"{method.upper()}{timestamp}{path}{payload}"
    return hmac.new(
        secret.encode("utf-8"),
        signature_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

def execute():
    base_url = settings.DELTA_BASE_URL.rstrip("/")
    api_key = settings.DELTA_API_KEY.get_secret_value()
    api_secret = settings.DELTA_API_SECRET.get_secret_value()

    results = {
        "base_url": base_url,
        "api_key_prefix": api_key[:4] if api_key else "",
        "timestamp": time.time(),
        "endpoints": []
    }

    with httpx.Client(timeout=10.0) as client:
        # Check clock skew
        try:
            r_time = client.get(f"{base_url}/v2/time")
            if r_time.status_code == 200:
                server_time = r_time.json().get("result", {}).get("time", 0)
                local_time = int(time.time() * 1000)
                results["clock_skew_sec"] = round(abs(local_time - server_time) / 1000.0, 2)
        except Exception as e:
            results["clock_skew_error"] = str(e)

        endpoints = [
            ("GET", "/v2/wallet/balances", ""),
            ("GET", "/v2/positions/margined", ""),
            ("GET", "/v2/orders?state=open", "")
        ]

        for method, path, payload in endpoints:
            timestamp = str(int(time.time()))
            sig = generate_signature(method, path, payload, timestamp, api_secret)
            headers = {
                "api-key": api_key,
                "signature": sig,
                "timestamp": timestamp,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            url = f"{base_url}{path}"
            t0 = time.perf_counter()
            try:
                res = client.request(method, url, headers=headers)
                latency = round((time.perf_counter() - t0) * 1000.0, 2)
                
                ep_res = {
                    "method": method,
                    "url": url,
                    "status_code": res.status_code,
                    "latency_ms": latency,
                    "headers": dict(res.headers),
                    "body": res.json() if res.headers.get("content-type", "").startswith("application/json") else res.text
                }
                results["endpoints"].append(ep_res)
            except Exception as e:
                results["endpoints"].append({
                    "method": method,
                    "url": url,
                    "error": str(e)
                })

    with open("scratch/verify_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    execute()
