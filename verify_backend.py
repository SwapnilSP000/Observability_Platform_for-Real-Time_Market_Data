import os
import sys
import time
import json
import httpx
import hmac
import hashlib

# Force path
sys.path.insert(0, os.path.abspath("."))

from backend.app.core.config import settings

def generate_signature(method: str, path: str, payload: str, timestamp: str, secret: str) -> str:
    signature_data = f"{method.upper()}{timestamp}{path}{payload}"
    return hmac.new(
        secret.encode("utf-8"),
        signature_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

def verify():
    base_url = settings.DELTA_BASE_URL.rstrip("/")
    api_key = settings.DELTA_API_KEY.get_secret_value().strip()
    api_secret = settings.DELTA_API_SECRET.get_secret_value().strip()

    print("==================================================")
    print("MANDATORY VERIFICATION GATEWAY (verify_backend.py)")
    print("==================================================")
    print(f"Target Base URL: {base_url}")
    print(f"API Key:         {api_key[:4]}...{api_key[-4:] if len(api_key)>8 else ''}")

    # Check clock skew with GET /v2/time
    with httpx.Client(timeout=10.0) as client:
        clock_skew_offset = 0.0
        try:
            r_time = client.get(f"{base_url}/v2/time")
            if r_time.status_code == 200:
                server_time = r_time.json().get("result", {}).get("time", 0)
                local_time = int(time.time() * 1000)
                diff_sec = abs(local_time - server_time) / 1000.0
                print(f"Clock Skew Check: Local Time vs Server Time Diff = {diff_sec:.2f}s")
                if diff_sec > 30.0:
                    print("CRITICAL: Clock skew exceeds 30s!")
                clock_skew_offset = (server_time - local_time) / 1000.0
            else:
                print(f"Could not fetch server time: HTTP {r_time.status_code}")
        except Exception as e:
            print(f"Clock skew check exception: {e}")

        endpoints = [
            ("GET", "/v2/wallet/balances", ""),
            ("GET", "/v2/positions/margined", ""),
            ("GET", "/v2/orders?state=open", "")
        ]

        success_all = True
        for method, path, payload in endpoints:
            timestamp = str(int(time.time() + clock_skew_offset))
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
                latency = (time.perf_counter() - t0) * 1000.0
                print("\n--------------------------------------------------")
                print(f"Endpoint: {method} {url}")
                print(f"HTTP Status: {res.status_code} ({latency:.1f}ms)")
                print(f"Raw Response Body:")
                print(res.text)
                if res.status_code != 200:
                    success_all = False
            except Exception as e:
                print(f"Execution Error: {e}")
                success_all = False

        if success_all:
            print("\n==================================================")
            print("VERIFICATION GATEWAY SUCCESS: HTTP 200 ON ALL ENDPOINTS")
            print("==================================================")
        else:
            print("\n==================================================")
            print("VERIFICATION GATEWAY PENDING / FAILED: Check API key activation status")
            print("==================================================")

if __name__ == "__main__":
    verify()
