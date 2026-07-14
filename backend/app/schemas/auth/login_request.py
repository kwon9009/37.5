from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    login_id: str = Field(
        ...,
        min_length=4,
        max_length=50,
        description="로그인 아이디",
    )

    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="비밀번호",
    )
