"""라즈베리파이 메인 루프. 센서를 백그라운드로 읽으며 1초마다 서버로 전송."""
import os
import time
from datetime import datetime

from dotenv import load_dotenv
from sensors.mmwave import SensorReader  # ← read_dummy 대신 SensorReader
from uploader.client import send_vitals

load_dotenv()
PATIENT_ID = os.getenv("PATIENT_ID", "test-001")


def main():
    print(f"[시작] 환자 {PATIENT_ID} 모니터링... (Ctrl+C 로 종료)")
    reader = SensorReader()
    reader.start()                                  # 센서 읽기 백그라운드 시작
    try:
        while True:
            vitals = reader.get_latest()            # 최신 심박/호흡/재실
            vitals["patient_id"] = PATIENT_ID
            vitals["measured_at"] = datetime.now().isoformat(timespec="seconds")
            send_vitals(vitals)
            print("보냄:", vitals)
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[종료] 모니터링을 멈춥니다.")
    finally:
        reader.stop()


if __name__ == "__main__":
    main()
