from pydantic import BaseModel, ConfigDict, Field


class HospitalByCodeResponse(BaseModel):
    """병원 코드로 조회했을 때 보호자 앱에 돌려주는 정보.

    보호자가 문자로 받은 코드를 입력하면, 등록 전에 "이 병원이 맞는지"
    확인시켜 주는 용도다. 그래서 환자·의료진 정보는 담지 않는다.
    """

    model_config = ConfigDict(from_attributes=True)

    hospital_id: int
    hospital_code: str
    name: str
    area: str
    address: str

    # hospitals 테이블에 아직 전화번호 컬럼이 없어 항상 None으로 나간다.
    # 앱은 이 값이 없으면 "병원 연락" 버튼을 비활성으로 둔다.
    phone: str | None = Field(default=None)
