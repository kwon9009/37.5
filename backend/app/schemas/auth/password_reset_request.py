from pydantic import BaseModel, EmailStr, Field


class PasswordResetRequest(BaseModel):
    """비밀번호 재설정 메일 보내달라는 요청."""

    login_id: str = Field(
        ...,
        min_length=4,
        max_length=50,
        description="로그인 아이디",
        examples=["guardian01"],
    )

    email: EmailStr = Field(
        ...,
        description="그 계정에 등록된 이메일",
        examples=["guardian01@example.com"],
    )


class PasswordResetConfirm(BaseModel):
    """메일 링크를 타고 들어와 새 비밀번호를 정하는 요청."""

    token: str = Field(
        ...,
        min_length=10,
        description="메일 링크에 담겨 온 토큰",
    )

    new_password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="새 비밀번호",
        examples=["newPassword123!"],
    )
