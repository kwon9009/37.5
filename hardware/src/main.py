"""
라즈베리파이 메인 루프 - 뼈대 버전.
1초마다 (지금은 더미) 생체값을 만들어 서버로 전송합니다.

실행:  python src/main.py
"""
import os
import time

from dotenv import load_dotenv
from sensors.mmwave import read_dummy
from uploader.client import send_vitals

load_dotenv()
PATIENT_ID = os.getenv("PATIENT_ID", "test-001")


def main():
    print(f"[시작] 환자 {PATIENT_ID} 모니터링... (Ctrl+C 로 종료)")
    while True:
        vitals = read_dummy()          # 센서 연결 후 read_serial()로 교체
        vitals["patient_id"] = PATIENT_ID
        send_vitals(vitals)
        print("보냄:", vitals)
        time.sleep(1)


if __name__ == "__main__":
    main()
