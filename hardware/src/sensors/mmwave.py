"""
MR60BHA2 심박·호흡 센서 읽기.
지금은 실제 센서 없이 테스트할 수 있게 '더미 데이터'를 만듭니다.
센서를 연결하면 아래 read_serial()을 완성해서 read_dummy()를 대체하세요.
"""
import random


def read_dummy() -> dict:
    """센서 연결 전 테스트용 가짜 데이터."""
    return {
        "heart_rate": random.randint(60, 90),
        "breath_rate": random.randint(12, 20),
    }


# ===== 실제 센서 연결 후 사용 (참고 골격) =====
# import os
# import serial
#
# PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
#
# def read_serial() -> dict:
#     # MR60BHA2 기본값: 115200 baud, parity=NONE, stopbits=1
#     ser = serial.Serial(PORT, 115200, timeout=1)
#     line = ser.readline().decode(errors="ignore").strip()
#     # TODO: Seeed mmWave 예제의 출력 포맷에 맞춰 heart_rate / breath_rate 파싱
#     return {"heart_rate": ..., "breath_rate": ...}
