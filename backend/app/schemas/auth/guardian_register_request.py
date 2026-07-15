from pydantic import BaseModel, Field


class GuardianRegisterRequest(BaseModel):
    login_id: str = Field(
        ...,
        min_length=4,
        max_length=30,
        description="로그인 아이디",
        examples=["guardian01"],
    )

    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="비밀번호",
        examples=["password123!"],
    )

    name: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="보호자 이름",
        examples=["홍길동"],
    )

    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="휴대전화 번호",
        examples=["01012345678"],
    )
