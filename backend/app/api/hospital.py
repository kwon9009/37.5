from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.hospital_crud import get_by_code, list_areas, search_by_name
from app.schemas.hospital.hospital_by_code_response import HospitalByCodeResponse
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


# 병원 코드로 병원 확인 (보호자가 문자로 받은 코드를 입력, 로그인 불필요)
# 가입 전 단계에서 부르는 화면이라 인증을 걸지 않는다. 병원명·주소는 원래
# 공개 정보이고, 실제 환자 연동은 병원 승인을 거쳐야 하므로 이것만으로는
# 어떤 환자 정보에도 접근할 수 없다.
@router.get(
    "/by-code/{hospital_code}",
    response_model=HospitalByCodeResponse,
)
def get_hospital_by_code(
    hospital_code: str = Path(..., min_length=1, max_length=10),
    db: Session = Depends(get_db),
) -> HospitalByCodeResponse:

    hospital = get_by_code(db=db, hospital_code=hospital_code)

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="병원 코드를 찾을 수 없습니다. 병원에서 받은 코드를 다시 확인해 주세요.",
        )

    return HospitalByCodeResponse.model_validate(hospital)


# 병원이 등록된 지역 목록 (회원가입 화면의 지역 선택 칸 채우기용)
@router.get(
    "/areas",
    response_model=list[str],
)
def get_hospital_areas(
    db: Session = Depends(get_db),
) -> list[str]:
    return list_areas(db)
