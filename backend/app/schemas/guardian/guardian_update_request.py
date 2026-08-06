from pydantic import BaseModel, EmailStr, Field


class GuardianUpdateRequest(BaseModel):
    """계정 정보 수정 요청.

    보낸 항목만 바꾼다. 안 보낸 항목은 그대로 둔다.
    (이름만 고치려고 전화번호까지 다시 보내지 않아도 되게 하기 위함)
    """

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=20,
        description="보호자 이름",
        examples=["홍길동"],
    )

    phone: str | None = Field(
        default=None,
        min_length=10,
        max_length=20,
        description="휴대전화 번호",
        examples=["010-1234-5678"],
    )

    email: EmailStr | None = Field(
        default=None,
        description="비밀번호 찾기, 응급 알림 대체 수단으로 사용할 이메일",
        examples=["guardian01@example.com"],
    )
