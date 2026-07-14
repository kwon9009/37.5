from pydantic import BaseModel, Field

from app.models.enums import UserRole


class RegisterResponse(BaseModel):
    user_id: int = Field(
        description="사용자 ID",
        examples=[1],
    )

    login_id: str = Field(
        description="로그인 아이디",
        examples=["doctor01"],
    )

    role: UserRole = Field(
        description="사용자 권한",
        examples=["DEPARTMENT"],
    )

    message: str = Field(
        default="회원가입이 완료되었습니다.",
        description="처리 결과 메시지",
    )
