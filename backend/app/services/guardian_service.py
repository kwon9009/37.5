from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import guardian_crud
from app.crud.user_crud import exists_by_email
from app.models.guardian import Guardian
from app.models.user import User
from app.schemas.guardian.guardian_me_response import (
    GuardianMeResponse,
    MyPatientResponse,
)
from app.schemas.guardian.guardian_update_request import GuardianUpdateRequest
from app.services import permission_service


# 보호자 + 담당 환자를 화면용 응답으로 만든다 (조회와 수정이 같은 모양을 돌려주도록 공용화)
def _to_me_response(
    db: Session,
    guardian: Guardian,
) -> GuardianMeResponse:

    links = guardian_crud.get_patient_links(
        db=db,
        guardian_id=guardian.guardian_id,
    )

    patients = [
        MyPatientResponse(
            patient_id=link.patient.patient_id,
            name=link.patient.name,
            relation=link.relation,
            ward=link.patient.ward,
            room_num=link.patient.room_num,
            bed_num=link.patient.bed_num,
            status=link.patient.status,
            is_present=link.patient.is_present,
        )
        for link in links
    ]

    return GuardianMeResponse(
        guardian_id=guardian.guardian_id,
        name=guardian.name,
        phone=guardian.phone,
        email=guardian.user.email,
        patients=patients,
    )


# 로그인한 보호자 본인 + 담당 환자 조회
def get_my_info(
    db: Session,
    current_user: User,
) -> GuardianMeResponse:

    guardian = permission_service.get_guardian_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    return _to_me_response(db=db, guardian=guardian)


# 계정 정보 수정 (이름 / 연락처 / 이메일)
def update_my_info(
    db: Session,
    current_user: User,
    request: GuardianUpdateRequest,
) -> GuardianMeResponse:

    guardian = permission_service.get_guardian_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    # 이메일은 계정 전체에서 유일해야 한다.
    # 자기 이메일을 그대로 다시 보낸 경우는 중복이 아니므로 넘어간다.
    if request.email is not None and request.email != guardian.user.email:
        if exists_by_email(db=db, email=request.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 사용 중인 이메일입니다.",
            )
        guardian.user.email = request.email

    if request.name is not None:
        guardian.name = request.name

    if request.phone is not None:
        guardian.phone = request.phone

    db.commit()
    db.refresh(guardian)

    return _to_me_response(db=db, guardian=guardian)
