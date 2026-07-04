# 37.5 SmartCare — 프로젝트 컨텍스트 (CLAUDE.md)

이 파일은 Claude Code가 매 세션 시작 시 자동으로 읽는 프로젝트 설명서입니다.
git에 커밋되어 팀원 4명 전원이 동일한 맥락을 공유합니다.
(자세한 배경/설정 절차는 docs/PROJECT.md 참고)

## 프로젝트 개요
- 스마트 비접촉식 환자 모니터링 & 응급 대응 시스템.
- 라즈베리파이 + 60GHz mmWave 레이더로 환자의 심박·호흡을 비접촉 측정.
- 이상 징후 감지 시 병원 대시보드에 실시간 표시 + 보호자에게 SMS 알림.
- 팀: 비전공자 4명. 학교 공모전 프로젝트.

## 확정된 결정 (변경 시 이 파일도 함께 수정)
1. 저장소 구조: 컴포넌트별 "폴더" 분리(모노레포). 브랜치는 작업 단위로만 사용(GitHub Flow).
2. 체온(온도) 측정: 사용 안 함. 심박·호흡만 측정.
3. 낙상 감지: 카메라(OV5647) + 오픈소스 비전 AI(자세추정) 기반. 레이더 낙상센서 미사용.

## 하드웨어
- 컴퓨터: Raspberry Pi 5 (8GB)
- 생체 센서: Seeed MR60BHA2 (XIAO ESP32C6 내장) -> USB 시리얼로 RPi 연결.
  - XIAO에 Seeed Arduino mmWave 예제(mmWaveBreath) 펌웨어 업로드 후 시리얼(115200, parity=N, stop=1)로 심박/호흡 출력.
  - 주의: FDA2용 펌웨어를 올리면 기기가 고장남(brick). BHA2 예제만 사용.
  - 배치: 센서가 환자 가슴 방향, 0.4~1.5m 거리. 한 번에 한 사람만 안정 추적.
- 카메라: 160도 광각 CSI 카메라(OV5647), 낙상 감지용.
  - 주의: RPi5는 CSI 커넥터가 작음 -> 22핀<->15핀 변환 케이블 필요.
  - RPi5(Bookworm)는 rpicam / picamera2 사용. 서드파티 OV5647은 config.txt에 dtoverlay=ov5647 필요할 수 있음.

## 아키텍처 / 데이터 흐름
- 센서 -> RPi(Python) -> FastAPI로 1초마다 POST -> 이상 감지 -> SSE로 프론트에 실시간 push.
- 응급 판단은 "서버(FastAPI)"가 담당(웹앱 백그라운드 제한 회피). 응급 시 Aligo SMS로 보호자에게 웹앱 링크 전송.
- DB 저장 전략:
  - 현재 상태 테이블: 환자당 1행, 1초마다 UPDATE(덮어쓰기). 행을 계속 쌓지 말 것(DB 폭발 방지).
  - 이력 로그 테이블: 1분 평균값만 append.
  - 응급 로그 테이블: 이상 감지 시 전후 5분 1초 단위 정밀 데이터만 저장. 낙상은 event_type="FALL"로 구분.

## 기술 스택
- Backend: Python 3.11, FastAPI, SQLAlchemy, MySQL(PyMySQL), SSE(sse-starlette). API 문서는 Swagger 자동생성(/docs).
- Frontend: React + Vite, PWA, 상태관리 Zustand, HTTP Axios, 실시간 차트 Chart.js, 스타일 Tailwind CSS.
- Hardware: Python 3.11, pyserial(센서), requests(전송), OpenCV + 비전AI(낙상).
- 협업: GitHub, Notion(문서/진척), Figma(와이어프레임).

## 저장소 구조
- backend/  : FastAPI 서버 (app/api, models, schemas, crud, services, core)
- frontend/ : React 대시보드(병원) + 보호자 PWA
- hardware/ : RPi 센서 수집·전송 (src/sensors, camera, uploader)
- docs/     : 상세 배경 문서(PROJECT.md). ERD/시나리오 이미지도 여기에 둘 것.

## 개발 규칙 (컨벤션)
- 언어/버전: Python 3.11, Node 20 LTS로 통일. 각 컴포넌트는 가상환경(venv) 사용.
- 포매터: Python=Black, JS/React=Prettier(+ESLint). 저장 시 자동 포맷.
- 브랜치 이름: `타입/영역-내용` (예: feat/be-vitals-api, feat/hw-mmwave-reader). 타입=feat/fix/docs/chore, 영역=be/fe/hw.
- 커밋 메시지: `타입: 내용` (예: feat: 심박 파싱 추가).
- main 직접 push 금지. 항상 브랜치 -> PR -> 리뷰 1명 -> merge.

## Claude Code 작업 시 지켜야 할 규칙
- 이 팀은 비전공자이므로, 코드를 작성/수정할 때 "무엇을·왜" 하는지 한국어로 간단히 설명할 것.
- 위험한 작업(파일 대량 삭제, git force push, DB 초기화, .env 커밋 등) 전에는 반드시 먼저 확인받을 것.
- 비밀정보 파일(.env 등)은 절대 커밋하지 말 것. .env.example만 유지.
- 큰 기능을 한 번에 만들지 말고, 먼저 "동작하는 최소 뼈대"부터 만들 것.
- 확실하지 않으면 추측하지 말고 물어볼 것.

## 현재 상태 & 다음 목표
- 상태: GitHub 저장소 생성 완료. 개발 환경 세팅 시작 단계.
- 다음 목표(첫 스프린트): "동작하는 뼈대" — 더미 심박값 하나가
  hardware -> backend(POST) -> SSE -> frontend 화면까지 실시간으로 흐르게 만들기.
  그다음 실제 센서/DB/차트로 하나씩 교체.
