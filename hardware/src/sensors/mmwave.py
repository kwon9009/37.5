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

# 재실 감지(Person Information)는 '상태가 바뀔 때만' 오므로 더 길게 인정한다
PRESENCE_HOLD_SEC = float(os.getenv("PRESENCE_HOLD_SEC", "30"))

# 측정값이 들어오기 시작한 뒤 이 시간까지는 '안정화 중'으로 보고 전송하지 않는다.
# (레이더가 lock을 잡는 동안 호흡이 1~10처럼 무의미한 값으로 나오기 때문)
STABILIZE_SEC = float(os.getenv("STABILIZE_SEC", "20"))

# --- 로그 파싱 규칙 (실측으로 검증 완료) ---
_ANSI = re.compile(r"\x1b\[[0-9;]*m")  # 로그의 색상 제어문자 제거용
_RE_HEART = re.compile(r"Real-time heart rate'?:\s*Sending state\s*([\d.]+)")
_RE_BREATH = re.compile(r"Real-time respiratory rate'?:\s*Sending state\s*([\d.]+)")
# 거리: 레이더가 '타깃을 감지했을 때만' 내보내는 네이티브 신호 → 재실 판단에 사용
_RE_DIST = re.compile(r"Distance to detection object'?:\s*Sending state\s*([\d.]+)")
# 재실 감지 센서(Person Information). 실측 확인 결과 이 펌웨어도 ON/OFF를 내보낸다.
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
        self._target = None   # 재실 감지 ON/OFF
        self._target_ts = 0.0  # 재실 감지 마지막 수신 시각
        self._vital_start_ts = 0.0  # 측정값이 (끊겼다가) 들어오기 시작한 시각
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

    def _mark_vital_arrived(self, now):
        """측정값이 새로 들어왔음을 기록. 8초 넘게 끊겼다가 다시 오면
        안정화 타이머를 처음부터 다시 센다(사람이 바뀌었을 수 있으므로)."""
        last = max(self._hr_ts, self._br_ts)
        if now - last > FRESH_WINDOW:
            self._vital_start_ts = now

    def _parse(self, raw):
        line = _ANSI.sub("", raw)
        now = time.time()
        if (m := _RE_HEART.search(line)):
            value = int(float(m.group(1)))
            # 센서는 사람을 놓치면 0을 보낸다 → '측정 실패' 신호이지 심박 0이 아니다
            if value > 0:
                with self._lock:
                    self._mark_vital_arrived(now)
                    self._hr, self._hr_ts = value, now
        elif (m := _RE_BREATH.search(line)):
            value = int(float(m.group(1)))
            if value > 0:
                with self._lock:
                    self._mark_vital_arrived(now)
                    self._br, self._br_ts = value, now
        elif _RE_DIST.search(line):
            with self._lock:
                self._dist_ts = now                   # 거리 신호 = 타깃 감지됨
        elif (m := _RE_TARGET.search(line)):
            with self._lock:
                self._target = (m.group(1) == "ON")
                self._target_ts = now

    def get_latest(self) -> dict:
        """지금 이 순간의 심박/호흡/재실 스냅샷 (메인이 1초마다 호출)."""
        now = time.time()
        with self._lock:
            hr_fresh = (now - self._hr_ts) <= FRESH_WINDOW
            br_fresh = (now - self._br_ts) <= FRESH_WINDOW
            dist_fresh = (now - self._dist_ts) <= FRESH_WINDOW
            target_fresh = (now - self._target_ts) <= PRESENCE_HOLD_SEC
            hr = self._hr if hr_fresh else None
            br = self._br if br_fresh else None
            target = self._target
            vital_start = self._vital_start_ts

        # 재실 판정: '사람이 있다'는 긍정 신호가 하나라도 최근에 들어왔는지로 본다.
        #  - 재실 감지(ON)는 상태가 바뀔 때만 오므로 30초까지 인정
        #  - 거리/심박/호흡은 레이더가 타깃을 잡고 있을 때만 나오는 신호
        # OFF가 왔다고 곧바로 부재로 단정하지 않는다. 심박이 들어오는 중에 OFF 하나로
        # 측정값이 통째로 버려지던 문제가 있었다.
        presence = (
            (target is True and target_fresh) or dist_fresh or hr_fresh or br_fresh
        )

        # 재실이 아니면 심박/호흡은 무의미 → None(측정 없음)
        if not presence:
            return {"heart_rate": None, "breath_rate": None,
                    "presence": False, "stabilizing": False}

        # 안정화 대기: 측정값이 들어오기 시작한 직후 구간은 레이더가 lock을 잡는 중이라
        # 호흡이 1~10처럼 무의미하게 나온다. 이 구간 값은 보내지 않는다.
        stabilizing = (
            vital_start == 0.0 or (now - vital_start) < STABILIZE_SEC
        )
        if stabilizing:
            hr = br = None

        return {"heart_rate": hr, "breath_rate": br,
                "presence": True, "stabilizing": stabilizing}


# 센서 없이 백엔드 흐름만 테스트할 때 쓰는 더미 (그대로 남겨둠)
import random


def read_dummy() -> dict:
    return {"heart_rate": random.randint(60, 90),
            "breath_rate": random.randint(12, 20),
            "presence": True, "stabilizing": False}
