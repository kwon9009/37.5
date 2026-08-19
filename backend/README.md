# Backend (FastAPI)

## 처음 받았을 때

```bash
python -m venv venv
venv\Scripts\activate             # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
```

`.env` 의 `DATABASE_URL` 에 **본인 MySQL 비밀번호**를 넣어야 합니다. git 에 올라가지 않는
파일이라 저장소를 새로 받을 때마다 만들어야 합니다.

```
DATABASE_URL=mysql+pymysql://root:비밀번호@127.0.0.1:3306/human_exe
```

- 비밀번호에 `@` 가 있으면 `%40`, `#` 은 `%23`, `:` 는 `%3A` 로 바꿔 넣습니다.
- 메모장으로 저장하면 파일 앞에 보이지 않는 표식(BOM)이 붙어 `DATABASE_URL` 을 못 읽는
  일이 있습니다. 그때는 VS Code 에서 인코딩을 `UTF-8`(BOM 없음)로 저장하세요.

## DB 준비 (처음 한 번)

```bash
mysql -u root -p < ../docs/DDL.sql        # 테이블 생성
PYTHONPATH=. python scripts/import_hospitals.py       # 대전 병원 44개
PYTHONPATH=. python scripts/import_mock_hospitals.py  # 타지역 목업 병원
PYTHONPATH=. python scripts/seed.py                   # 계정·환자·측정값 시드
```

시드 계정은 전부 비밀번호가 `1234` 입니다. **로컬 개발용이며 배포에는 쓰지 마세요.**

| 아이디 | 역할 | 로그인 화면 |
|---|---|---|
| `admin` | 관리자 | `/admin-login` |
| `dept01` ~ `dept03` | 병원 스태프 | `/login` |
| `guardian01` ~ `guardian05` | 보호자 | `/guardian/login` |

MySQL 을 설치하기 어려운 팀원은 SQLite 로도 띄울 수 있습니다(임시).

```bash
DATABASE_URL=sqlite:///./dev.db PYTHONPATH=. python scripts/_dev_sqlite_tables.py
```

## 실행

```bash
uvicorn app.main:app --reload
```

- API 문서(자동 생성): http://localhost:8000/docs
- 상태 확인: http://localhost:8000/health

`.env` 는 서버가 시작할 때 한 번만 읽습니다. 값을 고쳤으면 서버를 껐다 켜야 합니다.

## 폴더 구조
- app/models/  : SQLAlchemy 테이블 정의 (스키마 원본은 `docs/DDL.sql`)
- app/crud/    : DB 조회·저장
- app/api/     : 라우터(엔드포인트)
- app/services/: 이상 감지 판정, 알림 발송
