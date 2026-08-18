"""측정값을 서버로 전송."""
import os

import requests


def send_vitals(payload: dict) -> None:
    # SERVER_URL은 보낼 때마다 읽는다 (main.py의 load_dotenv() 이후 .env 값이 반영되도록)
    server_url = os.getenv("SERVER_URL", "http://localhost:8000")
    try:
        response = requests.post(f"{server_url}/api/vitals", json=payload, timeout=2)
        # 서버가 4xx/5xx를 돌려줘도 requests는 예외를 내지 않는다.
        # 확인하지 않으면 서버 오류로 값이 버려져도 "보냄"으로 남아,
        # 나중에 데이터가 비어 있는 이유를 찾을 수 없게 된다.
        response.raise_for_status()
    except requests.HTTPError as e:
        body = (e.response.text or "")[:200] if e.response is not None else ""
        print(f"전송 거부(HTTP {e.response.status_code if e.response is not None else '?'}): {body}")
    except requests.RequestException as e:
        print("전송 실패:", e)
