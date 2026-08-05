from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.hospital_crud import list_areas, search_by_name
from app.schemas.hospital.hospital_response import HospitalResponse

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospital"],
)


# 소속 병원 검색 (회원가입 화면에서 사용, 로그인 불필요)
# query=이름 / area=지역. 둘 다 선택 사항이라 지역만으로도 목록을 볼 수 있다.
@router.get(
    "",
    response_model=list[HospitalResponse],
)
def search_hospitals(
    query: str | None = Query(default=None, min_length=1),
    area: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
) -> list[HospitalResponse]:
    return search_by_name(
        db=db,
        query=query,
        area=area,
    )


# 병원이 등록된 지역 목록 (회원가입 화면의 지역 선택 칸 채우기용)
@router.get(
    "/areas",
    response_model=list[str],
)
def get_hospital_areas(
    db: Session = Depends(get_db),
) -> list[str]:
    return list_areas(db)
