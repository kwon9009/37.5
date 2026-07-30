from pydantic import BaseModel, EmailStr, Field


class DepartmentRegisterRequest(BaseModel):
    hospital_id: int = Field(
        ...,
        description="소속 병원 ID (병원 검색에서 선택)",
        examples=[1],
    )

    department_name: str = Field(
        ...,
        min_length=2,
        max_length=20,
        description="진료과명",
        examples=["내과"],
    )

    login_id: str = Field(
        ...,
        min_length=4,
        max_length=30,
        description="로그인 아이디",
        examples=["doctor01"],
    )

    email: EmailStr = Field(
        ...,
        description="비밀번호 찾기 등에 사용할 이메일",
        examples=["doctor01@hospital.kr"],
    )

    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="비밀번호",
        examples=["password123!"],
    )
