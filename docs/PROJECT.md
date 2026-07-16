# 프로젝트 상세 문서

CLAUDE.md는 짧은 지침서이고, 이 파일은 자세한 배경입니다.
(Claude Code는 필요할 때 이 파일을 열어봅니다.)

## 1. 시나리오 요약
- 시나리오 1 (상시 모니터링): 침상 벽/거치대에 비접촉 모듈 설치 -> 환자 등록 ->
  심박·호흡을 24시간 실시간 추적 -> 보호자/간병인이 앱·대시보드로 '정상' 확인.
- 시나리오 2 (급변 발생): 이상 징후 감지 -> 병상 모듈이 즉시 서버 전송 ->
  병원 대시보드에 붉은 팝업+경보 -> 보호자에게 푸시/문자 -> 119 호출·상급병원 이송(골든타임 4분 내).

## 2. ERD 테이블 (요약)
hospitals, admins, admin_hospitals, departments, patients, guardians,
patient_guardians(환자<->보호자 다대다), alerts, devices, vital_checks(현재 상태),
vital_logs(1분 평균 이력), emergency_logs(응급 정밀 로그).
- 낙상 이벤트는 emergency_logs.event_type = "FALL" 로 저장(심박 이상과 구분).
- 로그 테이블엔 (patient_id, created_at) 인덱스 권장.
- ERD/플로우차트/시나리오 원본 이미지는 이 docs/ 폴더에 넣어두세요.
- **실제 DDL/컬럼 단위 스키마는 저장소에 올리지 않고 노션에서 관리함.** 프론트 작업 중 필요해서
  바뀐 내용(예: users.email 추가, admins/admin_hospitals 모델 반영)이 있으면 노션 스키마 문서를
  갱신할 것 — 자세한 변경 이력은 대화/커밋 로그 참고, 별도 md 파일로 저장소에 남기지 않는다.

## 3. 하드웨어 상세 세팅
### MR60BHA2 (심박·호흡)
- 기본적으로 ESPHome 펌웨어(스마트홈용)가 미리 깔려 나옴 -> 우리 구조엔 안 맞음.
- Seeed Arduino mmWave 라이브러리의 mmWaveBreath 예제를 XIAO ESP32C6에 업로드 -> 심박/호흡을 시리얼로 출력.
- USB 연결 후 `ls /dev/ttyACM*` 로 포트 확인 -> hardware/.env의 SERIAL_PORT 설정.
- 통신: 115200 baud, parity=NONE, stopbits=1.
- 경고: 낙상용(FDA2) 펌웨어를 BHA2에 올리면 기기가 고장남. 예제 구분 필수.

### OV5647 카메라 (낙상)
- RPi5는 커넥터가 작아 22핀<->15핀 변환 케이블 필요.
- /boot/firmware/config.txt 에 필요 시 dtoverlay=ov5647 추가 후 재부팅, rpicam-hello 로 확인.

## 4. 낙상 감지 (비전 AI) 접근
- 방식: 경량 자세추정 모델로 관절(keypoints) 추출 -> 낙상 규칙(heuristic) 적용.
- 모델 후보: MediaPipe Pose(가벼움), MoveNet(TFLite, 빠름), YOLOv8n-pose(자료 풍부).
- 낙상 규칙 예: 사람 박스가 세로->가로로 급변하며 일정 시간 유지 / 어깨·엉덩이 높이 급락.
- 성능: RPi5 CPU만으론 느릴 수 있음 -> 경량 모델 / AI HAT(Hailo) / 서버 추론 중 선택.
  단 영상 전송은 대역폭·프라이버시 부담 -> 라파에서 판단 후 "낙상 이벤트"만 서버로.
- 160도 어안 렌즈는 가장자리 왜곡 큼 -> 필요 시 왜곡보정 후 추론.
- 진행 순서: (1) 관절 화면에 그리기 -> (2) 낙상 규칙 붙이기 -> (3) 서버 이벤트 연동.

## 5. 알림 흐름
- 응급 스크리닝은 전적으로 서버가 담당(웹앱 백그라운드 제한 회피).
- 1차: Aligo SMS로 보호자에게 문자 + 웹앱 링크(클릭 시 대응 화면).
- 카카오 알림톡은 템플릿 심사에 시간이 걸리므로 프로토타입은 SMS부터.
