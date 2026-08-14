from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.admin_hospital import AdminHospital


# 관리자 목록 조회
def get_admin_names(
    db: Session,
) -> list[Admin]:
    stmt = select(Admin).order_by(Admin.admin_id)

    return list(db.scalars(stmt))


# 관리자 ID로 조회
def get_admin_by_id(
    db: Session,
    admin_id: int,
) -> Admin | None:
    return db.get(Admin, admin_id)


# user_id로 관리자 조회 (로그인한 User -> Admin 레코드 찾을 때 사용)
def get_admin_by_user_id(
    db: Session,
    user_id: int,
) -> Admin | None:
    stmt = select(Admin).where(Admin.user_id == user_id)

    return db.scalar(stmt)


# 관리자 계정 생성 (User는 미리 만들어져 있어야 함)
def create_admin(
    db: Session,
    user_id: int,
    name: str,
    email: str,
    phone: str,
) -> Admin:

    admin = Admin(
        user_id=user_id,
        name=name,
        email=email,
        phone=phone,
    )

    db.add(admin)
    db.flush()

    return admin


# 전체 병원을 보는 슈퍼관리자인지 (admins.is_super_admin 플래그 기준)
def is_super_admin(
    db: Session,
    admin_id: int,
) -> bool:
    admin = db.get(Admin, admin_id)

    return admin is not None and admin.is_super_admin


# 이 관리자가 접근 가능한 병원 ID 목록 (슈퍼관리자면 빈 리스트 - 호출 쪽에서 "전체 허용"으로 해석)
def get_accessible_hospital_ids(
    db: Session,
    admin_id: int,
) -> list[int]:
    stmt = select(AdminHospital.hospital_id).where(AdminHospital.admin_id == admin_id)

    return list(db.scalars(stmt))
