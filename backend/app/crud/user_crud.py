from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.admin_hospital import AdminHospital
from app.models.department import Department
from app.models.guardian import Guardian
from app.models.hospital import Hospital
from app.models.user import User


# login_id로 사용자 조회
def get_by_login_id(
    db: Session,
    login_id: str,
) -> User | None:
    stmt = select(User).where(User.login_id == login_id)
    return db.scalar(stmt)


# user_id로 사용자 조회
def get_by_user_id(
    db: Session,
    user_id: int,
) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    return db.scalar(stmt)


# login_id 존재 여부 확인
def exists_by_login_id(
    db: Session,
    login_id: str,
) -> bool:
    return (
        get_by_login_id(
            db=db,
            login_id=login_id,
        )
        is not None
    )


# 이메일로 사용자 조회
def get_by_email(
    db: Session,
    email: str,
) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.scalar(stmt)


# 이메일 존재 여부 확인
def exists_by_email(
    db: Session,
    email: str,
) -> bool:
    return (
        get_by_email(
            db=db,
            email=email,
        )
        is not None
    )


# 사용자 생성
def create_user(
    db: Session,
    user: User,
) -> User:

    db.add(user)
    db.flush()

    return user


# 활성/비활성 상태 변경
def set_active(
    db: Session,
    user: User,
    is_active: bool,
) -> User:

    user.is_active = is_active

    db.flush()

    return user


# 권한관리 화면용 관리자 계정 목록.
# 슈퍼관리자는 여러 병원(또는 전체)에 걸쳐 있을 수 있어 대표 병원 하나만 뽑는다.
def list_admin_rows(db: Session):
    hospital_subq = (
        select(
            AdminHospital.admin_id.label("admin_id"),
            func.min(Hospital.name).label("hospital_name"),
        )
        .select_from(AdminHospital)
        .join(Hospital, AdminHospital.hospital_id == Hospital.hospital_id)
        .group_by(AdminHospital.admin_id)
        .subquery()
    )

    stmt = (
        select(
            User.user_id,
            User.login_id,
            User.email,
            User.is_active,
            User.created_at,
            Admin.name,
            Admin.is_super_admin,
            hospital_subq.c.hospital_name,
        )
        .select_from(User)
        .join(Admin, Admin.user_id == User.user_id)
        .outerjoin(hospital_subq, hospital_subq.c.admin_id == Admin.admin_id)
    )

    return db.execute(stmt).all()


# 권한관리 화면용 부서(의료진) 계정 목록
def list_department_rows(db: Session):
    stmt = (
        select(
            User.user_id,
            User.login_id,
            User.email,
            User.is_active,
            User.created_at,
            Department.name,
            Hospital.name.label("hospital_name"),
        )
        .select_from(User)
        .join(Department, Department.user_id == User.user_id)
        .join(Hospital, Department.hospital_id == Hospital.hospital_id)
    )

    return db.execute(stmt).all()


# 권한관리 화면용 보호자 계정 목록
def list_guardian_rows(db: Session):
    stmt = (
        select(
            User.user_id,
            User.login_id,
            User.email,
            User.is_active,
            User.created_at,
            Guardian.name,
        )
        .select_from(User)
        .join(Guardian, Guardian.user_id == User.user_id)
    )

    return db.execute(stmt).all()


# 비밀번호 변경
def update_password(
    db: Session,
    user: User,
    password: str,
) -> User:
    user.password = password

    db.commit()
    db.refresh(user)

    return user
