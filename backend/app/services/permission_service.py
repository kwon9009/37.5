"""누가 무엇을 볼 수 있는지 검사하는 공통 모듈.

인증(로그인 했는가)은 dependencies/auth.py의 get_current_user가 담당하고,
여기서는 인가(그 자료를 볼 자격이 있는가)만 검사한다.

접근 규칙
- 관리자(ADMIN)     : 전체 열람 가능
- 부서(DEPARTMENT)  : 자기 부서 환자만
- 보호자(GUARDIAN)  : 자기와 연결된 환자만
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import department_crud, guardian_crud, patient_crud
from app.models.department import Department
from app.models.enums import UserRole
from app.models.guardian import Guardian
from app.models.patient import Patient
from app.models.user import User


# 로그인한 사용자의 부서를 가져온다 (부서 계정이 아니면 403)
def get_department_or_403(
    db: Session,
    user_id: int,
) -> Department:

    department = department_crud.get_by_user_id(
        db=db,
        user_id=user_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="부서 계정만 접근할 수 있습니다.",
        )

    return department


# 로그인한 사용자의 보호자 정보를 가져온다 (보호자 계정이 아니면 403)
def get_guardian_or_403(
    db: Session,
    user_id: int,
) -> Guardian:

    guardian = guardian_crud.get_by_user_id(
        db=db,
        user_id=user_id,
    )

    if guardian is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="보호자 계정만 접근할 수 있습니다.",
        )

    return guardian


# 이 사용자가 해당 환자를 볼 수 있는지 검사한다
def ensure_can_access_patient(
    db: Session,
    current_user: User,
    patient_id: int,
) -> Patient:

    patient = patient_crud.get_by_id(
        db=db,
        patient_id=patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 환자입니다.",
        )

    if current_user.role == UserRole.ADMIN:
        return patient

    if current_user.role == UserRole.DEPARTMENT:

        department = get_department_or_403(
            db=db,
            user_id=current_user.user_id,
        )

        if patient.department_id != department.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="담당 부서의 환자가 아닙니다.",
            )

        return patient

    if current_user.role == UserRole.GUARDIAN:

        guardian = get_guardian_or_403(
            db=db,
            user_id=current_user.user_id,
        )

        linked = guardian_crud.is_linked_to_patient(
            db=db,
            guardian_id=guardian.guardian_id,
            patient_id=patient_id,
        )

        if not linked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="담당 환자가 아닙니다.",
            )

        return patient

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="접근 권한이 없습니다.",
    )
