# 프론트엔드 작업 중 발생한 DB 관련 요청/변경 (2026-07-16)

프론트 화면(회원가입, 병원 검색, 비밀번호 찾기 등)을 실제 API에 연동하다가
DB(`human_exe`)를 직접 확인해보니 코드와 다른 부분이 있었고, 새로 필요한 컬럼도 있어서
정리해둔 문서. 원본 DDL은 `docs/schema.sql`에 있고, 여기는 **"무엇을 왜 바꿨는지/바꿔야 하는지"**만 기록.

## 1. 실제로 DB에 DDL을 실행한 것

### `users.email` 컬럼 추가
- **왜**: 부서(병원 스태프) 회원가입 화면에 이메일 필드를 추가하고, 비밀번호 찾기 본인확인을
  이메일로 하기로 해서 필요해짐. (기존엔 병원 코드로 하려다가, 병원 코드는 비밀값이 아니라
  본인확인 수단으로 부적절하다고 판단해서 이메일로 변경)
- **실행한 DDL** (로컬 dev DB에 이미 적용 완료, `docs/schema.sql`에도 반영함):
  ```sql
  ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL;
  ALTER TABLE users ADD UNIQUE INDEX uq_users_email (email);
  ```
  - `NULL` 허용인 이유: 보호자(guardian) 계정은 아직 이메일을 받지 않아서, 컬럼 자체를
    NOT NULL로 만들면 보호자 회원가입이 깨짐. 대신 부서 회원가입 API(`DepartmentRegisterRequest`)
    에서 필수값으로 강제함.
  - 기존 계정 1건은 `legacy-user-{user_id}@placeholder.local` 형식으로 백필함.

## 2. 코드만 고친 것 (DB는 이미 원래 DDL과 일치했음 — DDL 실행 안 함)

DB는 처음부터 맞게 만들어져 있었는데, `app/models/*.py`(SQLAlchemy 모델)만 덜 반영되어 있던 것들.
**DB 변경 없음, 파이썬 코드만 수정함.**

- `hospitals.hospital_code`: DB엔 `VARCHAR(50) NOT NULL UNIQUE`로 이미 있었는데 모델에
  컬럼 자체가 없었음 → `app/models/hospital.py`에 컬럼 추가
- `hospitals` 테이블 `UNIQUE(name, area)`, `departments` 테이블 `UNIQUE(hospital_id, name)`:
  DB엔 제약이 있었는데 모델에 `UniqueConstraint` 선언이 없었음 → 모델에 추가
- `admins`, `admin_hospitals` 테이블: DB엔 테이블이 있는데 대응하는 SQLAlchemy 모델
  파일 자체가 없었음 → `app/models/admin.py`, `app/models/admin_hospital.py` 신규 작성

## 3. 아직 반영 안 된 요청 (백엔드 확인 필요, DDL 변경 없음)

### 관리자(admin) 회원가입/로그인 API가 없음
`admins` 테이블·모델은 있지만, 그 테이블에 실제로 사람을 등록하는 API/서비스가 없다.
`/admin/*` 라우터는 `require_role(UserRole.ADMIN)`로 권한만 체크할 뿐이고, 프론트의
`/admin-login` 화면도 실제 로그인 API 호출 없이 그냥 `/admin/hospitals`로 이동만 함.
→ 관리자 계정을 실제로 어떻게 만들지(직접 DB에 넣는지, 별도 가입 절차가 있는지) 논의 필요.
(DDL 변경은 필요 없어 보임 — `admins` 테이블 자체는 이미 충분함)

### `patients` 테이블 필드와 환자 등록 화면 폼이 안 맞음
`patient-register-modal.jsx`(환자 등록 모달)를 실제 스키마와 비교했을 때:
- `patient_no`(환자등록번호, UNIQUE) 입력 필드가 화면에 없음
- 화면은 병실/병상을 "302호", "A-2" 같은 **문자열**로 받는데, DB는 `room_num`, `bed_num`을
  **INT**로 저장하도록 되어 있어서 그대로는 안 들어감 (파싱 규칙을 정하거나, 저장 방식을 다시
  논의해야 함)
- "보호자 연락처"는 `patients` 테이블 컬럼이 아니라 `guardians`+`patient_guardians`
  관계로 따로 관리되는 구조라, 환자 등록 폼에서 필드 하나로 받는 지금 방식과 실제 구조가 다름

(참고: `patients` 관련 API 자체가 백엔드에 아직 없어서, 지금 당장 에러가 나는 건 아니고
나중에 그 API를 만들 때 참고할 내용. 이것도 DDL 자체를 바꿔야 할지는 논의 필요 — 예를 들어
`room_num`/`bed_num`을 정말 INT로 유지할지, 화면처럼 문자열로 바꿀지)

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
