"""측정값을 서버로 전송."""
import os

import requests

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8000")


def send_vitals(payload: dict) -> None:
    try:
        requests.post(f"{SERVER_URL}/api/vitals", json=payload, timeout=2)
    except requests.RequestException as e:
        print("전송 실패:", e)
