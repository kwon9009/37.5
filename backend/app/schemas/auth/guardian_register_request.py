from pydantic import BaseModel, EmailStr, Field


class GuardianRegisterRequest(BaseModel):
    login_id: str = Field(
        ...,
        min_length=4,
        max_length=30,
        description="로그인 아이디",
        examples=["guardian01"],
    )

    email: EmailStr = Field(
        ...,
        description="비밀번호 찾기, 응급 알림 대체 수단으로 사용할 이메일",
        examples=["guardian01@example.com"],
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
