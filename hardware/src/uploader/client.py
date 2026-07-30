"""측정값을 서버로 전송."""
import os

import requests


def send_vitals(payload: dict) -> None:
    # SERVER_URL은 보낼 때마다 읽는다 (main.py의 load_dotenv() 이후 .env 값이 반영되도록)
    server_url = os.getenv("SERVER_URL", "http://localhost:8000")
    try:
        requests.post(f"{server_url}/api/vitals", json=payload, timeout=2)
    except requests.RequestException as e:
        print("전송 실패:", e)
