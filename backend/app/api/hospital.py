from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.hospital_crud import search_by_name
from app.schemas.hospital.hospital_response import HospitalResponse

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospital"],
)


# 소속 병원 검색 (회원가입 화면에서 사용, 로그인 불필요)
@router.get(
    "",
    response_model=list[HospitalResponse],
)
def search_hospitals(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> list[HospitalResponse]:
    return search_by_name(
        db=db,
        query=query,
    )
