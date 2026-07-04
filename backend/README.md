# Backend (FastAPI)

## 실행
python -m venv venv
source venv/bin/activate          # 윈도우: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

- API 문서(자동 생성): http://localhost:8000/docs
- 상태 확인: http://localhost:8000/health

## 뼈대 -> 실제로 확장할 부분
- app/models/  : SQLAlchemy로 ERD 테이블 정의
- app/services/: 이상 감지 로직, SMS 발송
- main.py의 메모리 저장 -> MySQL로 교체
