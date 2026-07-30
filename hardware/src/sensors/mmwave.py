"""
MR60BHA2(60GHz mmWave) 센서 읽기.

ESPHome 펌웨어가 USB 시리얼(/dev/ttyACM0, 115200)로 내보내는 로그를 파싱해
심박수·호흡수·재실(사람 유무)을 실시간으로 뽑아낸다.

구조: 백그라운드 스레드가 시리얼을 계속 읽어 '최신값'을 보관하고,
      메인 루프는 1초마다 get_latest()로 스냅샷만 가져간다.
      (읽기/전송 분리 → 전송이 느려도 센서 읽기가 밀리지 않음)

읽기 방식: pyserial 대신 'cat'과 동일한 '파일 읽기'를 쓴다.
      ESP32-C6의 USB-Serial-JTAG에서 pyserial이 가끔 '읽을 게 있다는데 0바이트'
      오류를 내서, 실측으로 검증된 파일 읽기로 그 오류를 원천 차단한다.
      (나중에 사람이 있을 때 pyserial 방식으로 다시 시험해볼 예정)
"""
import os
import re
import select
import subprocess
import threading
import time

PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
BAUD = 115200

# 이 시간(초) 안에 새 심박/호흡/거리 신호가 안 들어오면 '측정 없음'으로 간주
FRESH_WINDOW = float(os.getenv("VITAL_FRESH_SEC", "8"))

# --- 로그 파싱 규칙 (실측으로 검증 완료) ---
_ANSI = re.compile(r"\x1b\[[0-9;]*m")  # 로그의 색상 제어문자 제거용
_RE_HEART = re.compile(r"Real-time heart rate'?:\s*Sending state\s*([\d.]+)")
_RE_BREATH = re.compile(r"Real-time respiratory rate'?:\s*Sending state\s*([\d.]+)")
# 거리: 레이더가 '타깃을 감지했을 때만' 내보내는 네이티브 신호 → 재실 판단에 사용
_RE_DIST = re.compile(r"Distance to detection object'?:\s*Sending state\s*([\d.]+)")
# has_target(ON/OFF): 이 펌웨어엔 없지만, 켜진 기기에서도 동작하도록 대비
_RE_TARGET = re.compile(r"Sending state\s+(ON|OFF)\b")


class SensorReader:
    """센서 로그를 백그라운드로 읽으며 최신 생체값을 보관."""

    def __init__(self, port=PORT, baud=BAUD):
        self.port, self.baud = port, baud
        self._lock = threading.Lock()
        self._hr = None       # 최근 심박수
        self._br = None       # 최근 호흡수
        self._hr_ts = 0.0     # 심박 마지막 수신 시각
        self._br_ts = 0.0     # 호흡 마지막 수신 시각
        self._dist_ts = 0.0   # 거리(=타깃 감지) 마지막 수신 시각
        self._target = None   # has_target ON/OFF (이 펌웨어엔 없어서 보통 None)
        self._running = False

    def start(self):
        self._running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self):
        self._running = False

    def _loop(self):
        """포트를 'cat'과 동일하게 raw 설정 후 '파일'로 읽어 최신값 갱신.
        (pyserial의 ESP32-C6 quirk 회피 — 끊기면 자동 재시도)"""
        while self._running:
            try:
                # cat 캡처와 동일하게 raw 모드로 세팅
                subprocess.run(["stty", "-F", self.port, str(self.baud),
                                "raw", "-echo"], check=False)
                with open(self.port, "rb", buffering=0) as f:
                    buf = b""
                    while self._running:
                        # 1초마다 종료 여부 확인 (데이터 없어도 멈춤 반응)
                        ready, _, _ = select.select([f], [], [], 1)
                        if not ready:
                            continue
                        chunk = f.read(256)
                        if not chunk:
                            continue
                        buf += chunk
                        while b"\n" in buf:            # 줄 단위로 잘라 파싱
                            line, buf = buf.split(b"\n", 1)
                            self._parse(line.decode("utf-8", errors="ignore"))
            except OSError as e:
                print(f"[센서] 포트 오류: {e} → 2초 후 재시도")
                time.sleep(2)

    def _parse(self, raw):
        line = _ANSI.sub("", raw)
        now = time.time()
        if (m := _RE_HEART.search(line)):
            with self._lock:
                self._hr, self._hr_ts = int(float(m.group(1))), now
        elif (m := _RE_BREATH.search(line)):
            with self._lock:
                self._br, self._br_ts = int(float(m.group(1))), now
        elif _RE_DIST.search(line):
            with self._lock:
                self._dist_ts = now                   # 거리 신호 = 타깃 감지됨
        elif (m := _RE_TARGET.search(line)):
            with self._lock:
                self._target = (m.group(1) == "ON")

    def get_latest(self) -> dict:
        """지금 이 순간의 심박/호흡/재실 스냅샷 (메인이 1초마다 호출)."""
        now = time.time()
        with self._lock:
            hr_fresh = (now - self._hr_ts) <= FRESH_WINDOW
            br_fresh = (now - self._br_ts) <= FRESH_WINDOW
            dist_fresh = (now - self._dist_ts) <= FRESH_WINDOW
            hr = self._hr if hr_fresh else None
            br = self._br if br_fresh else None
            target = self._target

        # 재실 판정(네이티브 감지 신호 기준):
        #  - has_target(ON/OFF)가 있으면 그걸 우선 사용
        #  - 없으면 거리/심박/호흡 중 하나라도 최근에 나왔으면 = 레이더가 타깃 감지 중
        presence = target if target is not None else (dist_fresh or hr_fresh or br_fresh)

        # 재실이 아니면 심박/호흡은 무의미 → None(측정 없음)
        if not presence:
            hr = br = None
        return {"heart_rate": hr, "breath_rate": br, "presence": presence}


# 센서 없이 백엔드 흐름만 테스트할 때 쓰는 더미 (그대로 남겨둠)
import random


def read_dummy() -> dict:
    return {"heart_rate": random.randint(60, 90),
            "breath_rate": random.randint(12, 20), "presence": True}
