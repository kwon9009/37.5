from pydantic import BaseModel, Field


class LoginIdCheckResponse(BaseModel):
    available: bool = Field(
        description="사용 가능한 아이디인지 여부",
        examples=[True],
    )

    message: str = Field(
        description="화면에 그대로 보여줄 안내 문구",
        examples=["사용할 수 있는 아이디입니다."],
    )
