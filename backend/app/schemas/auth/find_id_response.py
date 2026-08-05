from pydantic import BaseModel, Field


class FindIdResponse(BaseModel):
    found: bool = Field(
        description="일치하는 계정을 찾았는지",
        examples=[True],
    )

    masked_login_id: str | None = Field(
        default=None,
        description="일부를 가린 아이디. 못 찾았으면 없음",
        examples=["gua***01"],
    )

    message: str = Field(
        description="화면에 그대로 보여줄 안내 문구",
        examples=["회원님의 아이디입니다."],
    )
