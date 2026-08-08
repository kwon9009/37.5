"""보호자가 환자와 연동되는 과정을 담당한다.

흐름
  1. 보호자가 병원 코드 + 환자 이름·생년월일·관계로 신청한다
  2. 병원이 신청 목록에서 확인하고 승인하거나 거절한다
  3. 승인되면 보호자와 환자가 연결되어(patient_guardians) 생체정보를 볼 수 있게 된다

승인할 때 어느 환자인지는 병원이 직접 고른다. 신청서에는 이름과 생년월일만
있어서 동명이인이 있으면 서버가 혼자 정할 수 없고, 잘못 연결되면 보호자가
남의 환자 생체정보를 보게 되기 때문이다.
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import hospital_crud, patient_link_request_crud
from app.models.enums import PatientLinkRequestStatus, UserRole
from app.models.patient_link_request import PatientLinkRequest
from app.models.user import User
from app.schemas.patient_link_request.patient_link_request_create import (
    PatientLinkRequestCreate,
)
from app.schemas.patient_link_request.patient_link_request_decision import (
    PatientLinkRequestDecision,
)
from app.schemas.patient_link_request.patient_link_request_hospital_response import (
    MatchingPatientResponse,
    PatientLinkRequestHospitalResponse,
)
from app.schemas.patient_link_request.patient_link_request_response import (
    PatientLinkRequestResponse,
)
from app.services import permission_service


# 보호자용 응답으로 바꾼다 (병원 이름을 같이 담는다)
def _to_guardian_response(request: PatientLinkRequest) -> PatientLinkRequestResponse:
    return PatientLinkRequestResponse(
        request_id=request.request_id,
        hospital_id=request.hospital_id,
        hospital_name=request.hospital.name,
        patient_name=request.patient_name,
        birthdate=request.birthdate,
        relation=request.relation,
        status=request.status,
        created_at=request.created_at,
        processed_at=request.processed_at,
    )


# 병원용 응답으로 바꾼다 (신청자 정보 + 연결 후보 환자를 같이 담는다)
def _to_hospital_response(
    db: Session,
    request: PatientLinkRequest,
) -> PatientLinkRequestHospitalResponse:

    # 이미 처리된 신청은 후보를 찾을 필요가 없다. 목록을 열 때마다
    # 처리 끝난 건까지 환자 조회를 돌리면 느려지기만 한다.
    matching = []
    if request.status == PatientLinkRequestStatus.PENDING:
        matching = [
            MatchingPatientResponse.model_validate(patient)
            for patient in patient_link_request_crud.find_matching_patients(
                db=db,
                hospital_id=request.hospital_id,
                patient_name=request.patient_name,
                birthdate=request.birthdate,
            )
        ]

    return PatientLinkRequestHospitalResponse(
        request_id=request.request_id,
        guardian_id=request.guardian_id,
        guardian_name=request.guardian.name,
        guardian_phone=request.guardian.phone,
        patient_name=request.patient_name,
        birthdate=request.birthdate,
        relation=request.relation,
        status=request.status,
        created_at=request.created_at,
        processed_at=request.processed_at,
        matching_patients=matching,
    )


# 이 직원이 어느 병원의 신청을 다룰 수 있는지.
# 부서 계정은 자기 병원만, 관리자는 전체를 볼 수 있다(전체면 None).
def _staff_hospital_id(
    db: Session,
    current_user: User,
) -> int | None:

    if current_user.role == UserRole.ADMIN:
        return None

    department = permission_service.get_department_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    return department.hospital_id


# ── 보호자 ─────────────────────────────────────────────────────────

# 연동 신청
def submit_request(
    db: Session,
    current_user: User,
    request: PatientLinkRequestCreate,
) -> PatientLinkRequestResponse:

    guardian = permission_service.get_guardian_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    hospital = hospital_crud.get_by_code(
        db=db,
        hospital_code=request.hospital_code,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="병원 코드를 찾을 수 없습니다. 병원에서 받은 코드를 다시 확인해 주세요.",
        )

    # 대기 중인 같은 신청이 있으면 또 만들지 않는다.
    # 신청 버튼을 두 번 누르거나 화면을 새로고침해도 중복이 쌓이지 않게 한다.
    duplicate = patient_link_request_crud.find_pending_duplicate(
        db=db,
        guardian_id=guardian.guardian_id,
        hospital_id=hospital.hospital_id,
        patient_name=request.patient_name,
        birthdate=request.birthdate,
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 승인을 기다리는 신청이 있습니다.",
        )

    created = patient_link_request_crud.create(
        db=db,
        request=PatientLinkRequest(
            guardian_id=guardian.guardian_id,
            hospital_id=hospital.hospital_id,
            patient_name=request.patient_name,
            birthdate=request.birthdate,
            relation=request.relation,
            status=PatientLinkRequestStatus.PENDING,
        ),
    )

    return _to_guardian_response(created)


# 내가 낸 신청 목록 (대기 화면에서 상태를 확인한다)
def list_my_requests(
    db: Session,
    current_user: User,
) -> list[PatientLinkRequestResponse]:

    guardian = permission_service.get_guardian_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    requests = patient_link_request_crud.list_by_guardian(
        db=db,
        guardian_id=guardian.guardian_id,
    )

    return [_to_guardian_response(request) for request in requests]


# ── 병원 ───────────────────────────────────────────────────────────

# 우리 병원으로 들어온 신청 목록
def list_hospital_requests(
    db: Session,
    current_user: User,
    request_status: PatientLinkRequestStatus | None = None,
    hospital_id: int | None = None,
) -> list[PatientLinkRequestHospitalResponse]:

    staff_hospital_id = _staff_hospital_id(db=db, current_user=current_user)

    # 부서 계정은 자기 병원만 본다. 관리자는 병원을 지정하지 않으면 전체를 본다.
    target_hospital_id = staff_hospital_id if staff_hospital_id is not None else hospital_id

    if target_hospital_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="조회할 병원을 지정해 주세요.",
        )

    requests = patient_link_request_crud.list_by_hospital(
        db=db,
        hospital_id=target_hospital_id,
        status=request_status,
    )

    return [_to_hospital_response(db=db, request=request) for request in requests]


# 신청 한 건 (상세 화면용)
def get_hospital_request(
    db: Session,
    current_user: User,
    request_id: int,
) -> PatientLinkRequestHospitalResponse:

    link_request = _load_for_staff(
        db=db,
        current_user=current_user,
        request_id=request_id,
    )

    return _to_hospital_response(db=db, request=link_request)


# 병원 직원이 다룰 수 있는 신청인지 확인하고 가져온다
def _load_for_staff(
    db: Session,
    current_user: User,
    request_id: int,
) -> PatientLinkRequest:

    link_request = patient_link_request_crud.get_by_id(
        db=db,
        request_id=request_id,
    )

    if link_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 신청입니다.",
        )

    # 다른 병원 신청은 보지도 건드리지도 못하게 막는다
    staff_hospital_id = _staff_hospital_id(db=db, current_user=current_user)

    if staff_hospital_id is not None and link_request.hospital_id != staff_hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 병원의 신청입니다.",
        )

    return link_request


# 승인 / 거절
def decide_request(
    db: Session,
    current_user: User,
    request_id: int,
    decision: PatientLinkRequestDecision,
) -> PatientLinkRequestHospitalResponse:

    link_request = _load_for_staff(
        db=db,
        current_user=current_user,
        request_id=request_id,
    )

    # 이미 처리된 신청을 다시 처리하지 못하게 한다.
    # 두 담당자가 동시에 열어두고 각각 승인/거절을 누르는 경우를 막는다.
    if link_request.status != PatientLinkRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 처리된 신청입니다.",
        )

    if decision.approve:
        _approve(db=db, link_request=link_request, patient_id=decision.patient_id)
        link_request.status = PatientLinkRequestStatus.APPROVED
    else:
        link_request.status = PatientLinkRequestStatus.REJECTED

    link_request.processed_at = datetime.now()

    db.commit()
    db.refresh(link_request)

    return _to_hospital_response(db=db, request=link_request)


# 승인 처리: 고른 환자가 신청 내용과 맞는지 확인하고 보호자와 연결한다
def _approve(
    db: Session,
    link_request: PatientLinkRequest,
    patient_id: int | None,
) -> None:

    if patient_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="승인하려면 연결할 환자를 선택해 주세요.",
        )

    # 고른 환자가 정말 이 병원의, 신청서와 같은 이름·생년월일인지 다시 확인한다.
    # 화면에서 고르게 하더라도 요청은 조작될 수 있어서 서버가 한 번 더 본다.
    candidates = patient_link_request_crud.find_matching_patients(
        db=db,
        hospital_id=link_request.hospital_id,
        patient_name=link_request.patient_name,
        birthdate=link_request.birthdate,
    )

    if not any(patient.patient_id == patient_id for patient in candidates):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="신청 내용과 맞지 않는 환자입니다. 이름과 생년월일을 확인해 주세요.",
        )

    # 이미 연결돼 있으면 또 만들지 않는다 (승인만 처리하고 넘어간다)
    already_linked = patient_link_request_crud.link_exists(
        db=db,
        patient_id=patient_id,
        guardian_id=link_request.guardian_id,
    )

    if already_linked:
        return

    patient_link_request_crud.create_link(
        db=db,
        patient_id=patient_id,
        guardian_id=link_request.guardian_id,
        relation=link_request.relation,
    )
