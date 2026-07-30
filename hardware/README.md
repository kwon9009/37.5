## 시스템 구성

```text
MR60BHA2
   ↓
XIAO ESP32C6
   ↓ USB Serial
Raspberry Pi 5
   ↓ HTTP/API
FastAPI Backend
   ↓
Database / Hospital Dashboard / Guardian App
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Hardware | Raspberry Pi 5, MR60BHA2, XIAO ESP32C6 |
| Sensor communication | USB Serial, 115200 baud |
| Backend | Python, FastAPI, SQLAlchemy, MySQL |
| Remote access | Tailscale, SSH, VS Code Remote-SSH |

## 현재 개발 상태

- [x] MR60BHA2와 XIAO ESP32C6 연결
- [x] Raspberry Pi 5에서 USB 시리얼 장치 인식
- [x] 심박수와 호흡수 동시 출력 확인
- [x] Tailscale 및 SSH 원격 접속 확인
- [x] VS Code Remote-SSH 연동
- [x] 프론트엔드 로컬 실행
- [ ] 센서 로그 파싱 코드 완성
- [ ] 심박수·호흡수를 하나의 측정 데이터로 묶어 백엔드 전송
- [ ] 실시간 대시보드 연동
- [ ] 지속 시간과 신호 품질을 반영한 이상 감지

## 시작하기

## MR60BHA2 연결 확인

mmWave(MR60BHA2): XIAO ESP32C6에 Seeed Arduino mmWave 예제(mmWaveBreath) 업로드 -> USB로 RPI 연결 

RPI에서 USB 장치를 확인합니다.

```bash
lsusb
ls -l /dev/ttyACM*
ls -l /dev/serial/by-id/
```

정상 연결 시 일반적으로 다음 장치가 생성됩니다.

```text
/dev/ttyACM0
```

운영 환경에서는 장치 번호가 바뀔 수 있으므로 가능하면 `/dev/serial/by-id/` 아래의 고정 경로를 사용합니다.

### 심박수와 호흡수 확인

```bash
python3 -m serial.tools.miniterm --raw /dev/ttyACM0 115200 | grep --line-buffered -iE "Real-time (heart|respiratory) rate"
```

출력 예시:

```text
Real-time respiratory rate: Sending state 16.00000
Real-time heart rate: Sending state 82.00000 bpm
```

- `Real-time respiratory rate`: 분당 호흡수 추정값
- `Real-time heart rate`: 분당 심박수 추정값
- 종료: `Ctrl + ]` 또는 `Ctrl + C`

## 권장 측정 환경

- 센서와 측정 대상의 거리: 약 0.5~1.5m
- 센서를 가슴 방향으로 고정
- 한 번에 한 사람만 측정
- 측정 중 움직임 최소화
- 선풍기, 커튼, 진동 및 반사 물체의 간섭 최소화
- 단일 순간값이 아니라 일정 시간 유지되는 추세를 사용

## RPI 원격 접속

RPI의 Tailscale과 SSH 상태를 확인합니다.

```bash
tailscale status
tailscale ip -4
systemctl is-active tailscaled
systemctl is-active ssh
```

Windows에서 접속:

```powershell
tailscale ping <RPI_TAILSCALE_IP>
ssh ai@<RPI_TAILSCALE_IP>
```

VS Code SSH 설정 예시:

```ssh-config
Host rpi5-tailscale
HostName <RPI_TAILSCALE_IP>
User ai
```

공유기 포트포워딩이나 공인 인터넷에 SSH 포트를 공개하지 않습니다. 외부 담당자에게는 Tailscale 관리 페이지에서 해당 RPI 장비 한 대만 공유합니다.

## 환경변수 및 보안

각 폴더의 `.env.example`을 복사해 `.env`를 생성합니다.

```text
backend/.env
frontend/.env
hardware/.env
```
