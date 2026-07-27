from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.patient.patient_detail_response import (
    PatientDetailResponse,
)
from app.services import patient_service

router = APIRouter(
    prefix="/patients",
    tags=["Patient"],
)


# 환자 상세 조회
@router.get(
    "/{patient_id}",
    response_model=PatientDetailResponse,
)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return patient_service.get_patient_detail(
        db=db,
        patient_id=patient_id,
    )
