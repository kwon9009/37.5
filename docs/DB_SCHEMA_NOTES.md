# DB 스키마 점검 노트 (2026-07-16)

이 프로젝트엔 Alembic 같은 마이그레이션 도구가 없어서, DB 테이블(`human_exe`)과
`app/models/*.py`의 SQLAlchemy 모델이 어긋날 수 있다. 실제 DB에
`SHOW COLUMNS`(SQLAlchemy `inspect`)로 확인한 스키마와 모델 코드를 대조한 결과를
남긴다. **DB 구조를 바꿀 때마다 이 문서도 같이 업데이트할 것.**

## 발견된 불일치 (수정 완료)

### `hospitals` 테이블
- 실제 DB 컬럼: `hospital_id`, `name`, `area`, `hospital_code`(VARCHAR(50), NOT NULL)
- 기존 `app/models/hospital.py`: `hospital_code` 컬럼이 누락되어 있었음
  → ORM으로 병원을 새로 만들면 `Field 'hospital_code' doesn't have a default value` 에러 발생
- **조치**: `app/models/hospital.py`에 `hospital_code: Mapped[str]` 컬럼 추가함 (2026-07-16)
- 참고: `address`(주소) 컬럼은 실제 DB에도 없음 — 병원 검색/등록 화면에서 주소를 받더라도
  아직 저장할 곳이 없다.
- 기존 시드 데이터 (hospital_code는 병원 약어로 보임):

  | hospital_id | name | area | hospital_code |
  |---|---|---|---|
  | 1 | 서울대학교병원 | 서울 | SNUH |
  | 2 | 삼성서울병원 | 서울 | SSMC |
  | 3 | 대전병원 | 대전 | DJH |
  | 4 | 부산대학교병원 | 부산 | PNUH |
  | 5 | 전남대학교병원 | 광주 | CNUH |

## 발견된 갭 (아직 미조치 — 백엔드 담당자 확인 필요)

### `admins` 테이블 — 모델 자체가 없음
DB엔 테이블이 있는데 (`admin_id`, `user_id`, `name`, `email`, `phone`, `created_at`, `updated_at`)
`app/models/admin.py`가 아예 없다. 관리자 프로필(이름/이메일/연락처)을 다루는 CRUD/서비스/스키마도 없음.
`/admin/*` 라우터(`app/api/admin.py`)는 `require_role(UserRole.ADMIN)`으로 권한만 체크할 뿐,
관리자 회원가입·프로필 관련 로직은 아무것도 없는 상태.

### `admin_hospitals` 테이블 — 모델 자체가 없음
관리자↔병원 다대다 관계로 보이는 테이블(`admin_hospital_id`, `admin_id`, `hospital_id`)인데
이것도 모델이 없다. 관리자가 여러 병원을 담당하는 구조라면 이 관계가 언제/어떻게 채워지는지 확인 필요.

## 확인 방법 (재점검할 때 사용)

```python
from sqlalchemy import inspect
from app.core.database import engine

insp = inspect(engine)
for table in insp.get_table_names():
    print(table)
    for col in insp.get_columns(table):
        print(" ", col["name"], col["type"], "nullable=" + str(col["nullable"]))
```

## 전체 테이블 목록 (2026-07-16 기준)

`admin_hospitals`, `admins`, `alerts`, `departments`, `devices`, `emergency_logs`,
`guardians`, `hospitals`, `patient_guardians`, `patients`, `users`, `vital_checks`, `vital_logs`

위 목록 중 `admin_hospitals`, `admins`를 제외한 나머지 테이블은 모델과 컬럼이 전부 일치함을 확인함.
