# Hardware (Raspberry Pi 5)

## 1. 먼저 노트북에서 더미로 테스트
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # SERVER_URL을 백엔드 주소로
python src/main.py

백엔드가 켜져 있으면 1초마다 "보냄: {...}" 이 뜹니다.

## 2. 라즈베리파이 실제 세팅 (센서 도착 후)
- mmWave(MR60BHA2): XIAO ESP32C6에 Seeed Arduino mmWave 예제(mmWaveBreath) 업로드
  -> USB로 라파 연결 -> ls /dev/ttyACM* 로 포트 확인 -> .env의 SERIAL_PORT 설정
  -> sensors/mmwave.py 의 read_serial() 완성
- 주의: 낙상용 FDA2 펌웨어를 BHA2에 올리면 기기가 고장납니다. 예제 구분 주의!
- 카메라(OV5647): 파이5용 22핀<->15핀 변환 케이블 필요.
  /boot/firmware/config.txt 설정 후 rpicam-hello 로 확인
