# 37.5 SmartCare — 스마트 비접촉식 환자 모니터링 & 응급 대응 시스템

라즈베리파이 + mmWave 레이더로 환자의 심박·호흡을 비접촉 측정하고,
이상 징후 발생 시 병원 대시보드와 보호자에게 실시간으로 알리는 시스템.

## Claude Code 사용 안내
루트의 CLAUDE.md를 Claude Code가 매 세션 자동으로 읽어 프로젝트 맥락을 공유합니다.
VSCode에서 이 폴더를 열면 바로 적용됩니다. 자세한 배경은 docs/PROJECT.md 참고.

## 폴더 구조
- `backend/`  : FastAPI 서버 (데이터 수신 · DB · 실시간 SSE · 알림)
- `frontend/` : React 대시보드(병원) + 보호자 PWA
- `hardware/` : 라즈베리파이 센서 수집 · 서버 전송
- `docs/`     : 상세 문서 · ERD/시나리오 이미지

## 빠른 시작
각 폴더의 README.md 참고. 먼저 "동작하는 뼈대"부터 띄우세요:
1. backend 실행 -> 2. hardware(더미 데이터) 실행 -> 3. frontend에서 실시간 확인

## 협업 규칙
CONTRIBUTING.md 참고 (브랜치 · 커밋 규칙)

주의: 실제 비밀번호/키가 든 .env는 절대 커밋하지 마세요. .env.example만 공유합니다.
