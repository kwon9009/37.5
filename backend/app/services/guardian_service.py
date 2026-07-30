from sqlalchemy.orm import Session

from app.crud import guardian_crud
from app.models.user import User
from app.schemas.guardian.guardian_me_response import (
    GuardianMeResponse,
    MyPatientResponse,
)
from app.services import permission_service


# 로그인한 보호자 본인 + 담당 환자 조회
def get_my_info(
    db: Session,
    current_user: User,
) -> GuardianMeResponse:

    guardian = permission_service.get_guardian_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    links = guardian_crud.get_patient_links(
        db=db,
        guardian_id=guardian.guardian_id,
    )

    patients = []

    for link in links:

        patient = link.patient

        patients.append(
            MyPatientResponse(
                patient_id=patient.patient_id,
                name=patient.name,
                relation=link.relation,
                ward=patient.ward,
                room_num=patient.room_num,
                bed_num=patient.bed_num,
                status=patient.status,
                is_present=patient.is_present,
            )
        )

    return GuardianMeResponse(
        guardian_id=guardian.guardian_id,
        name=guardian.name,
        phone=guardian.phone,
        patients=patients,
    )
