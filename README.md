# 37.5℃ 병상 모듈 기반의 환자 생체 신호 실시간 모니터링 플랫폼 개발

Raspberry Pi 5와 MR60BHA2 mmWave 센서를 활용해 환자의 심박수와 호흡수를 비접촉 방식으로 추정하고, 병원 대시보드와 보호자 앱에 상태를 전달하는 플랫폼입니다.

## 주요 기능

- MR60BHA2 기반 비접촉 심박수·호흡수 추정
- Raspberry Pi 5에서 센서 데이터 수집
- FastAPI 백엔드로 측정 데이터 전송
- 병원 관리자용 실시간 모니터링 웹
- 보호자용 모바일 웹/PWA
- 이상 상태 지속 시 알림 및 응급 대응 지원
- Tailscale과 SSH를 이용한 안전한 RPI 원격 관리

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
| Frontend | React, Vite, Tailwind CSS, Zustand, Chart.js |
| Remote access | Tailscale, SSH, VS Code Remote-SSH |
| Deployment/Test | Docker |

## 저장소 구조

```text
37.5/
├── backend/     # FastAPI 서버, 인증, DB, 알림
├── frontend/    # 병원 대시보드 및 보호자 웹
├── hardware/    # RPI 센서 수집 및 서버 전송
├── docs/        # 프로젝트 상세 문서
└── README.md
```

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
- [ ] 보호자 알림 및 낙상 감지 연동

## 시작하기

### 저장소 받기

```bash
git clone https://github.com/kwon9009/37.5.git
cd 37.5
git switch develop
```

## 프론트엔드 실행

Windows PowerShell에서:

```powershell
cd frontend
if (!(Test-Path ".env")) { Copy-Item ".env.example" ".env" }
docker run --rm -it -p 127.0.0.1:5173:5173 -v "${PWD}:/app" -v "web_375_node_modules:/app/node_modules" -w /app node:22-alpine sh -c "npm install && npm run dev -- --host 0.0.0.0"
```

브라우저에서 다음 주소로 접속합니다.

```text
http://127.0.0.1:5173
```

`127.0.0.1`에만 포트를 열기 때문에 같은 PC에서만 접속할 수 있습니다.

## 백엔드 실행

```bash
cd backend
python -m venv venv
```

Windows:

```powershell
.\venv\Scripts\Activate.ps1
Copy-Item .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Linux/Raspberry Pi:

```bash
source venv/bin/activate
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

실행 후 확인:

```text
API 문서: http://localhost:8000/docs
상태 확인: http://localhost:8000/health
```

실행 전 `backend/.env`의 데이터베이스 주소와 비밀키를 개발 환경에 맞게 설정해야 합니다.

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

다음 정보는 GitHub에 커밋하지 않습니다.

- 실제 비밀번호
- 데이터베이스 계정
- JWT 비밀키
- API 키
- Tailscale 초대 링크
- 환자 개인정보 및 실제 측정 데이터

## 협업 주의사항

- 같은 파일을 동시에 수정하지 않습니다.
- 다른 작업자가 Git을 사용하는 동안 임의로 브랜치를 변경하지 않습니다.
- 센서 포트 `/dev/ttyACM0`을 여러 프로그램에서 동시에 열지 않습니다.
- RPI 재부팅, Docker 재시작, 펌웨어 변경 전 담당자에게 알립니다.
- 기능별 브랜치에서 작업한 뒤 Pull Request로 병합합니다.

자세한 실행 방법은 각 폴더의 README를 참고하세요.

- `backend/README.md`
- `frontend/README.md`
- `hardware/README.md`
- `docs/PROJECT.md`
