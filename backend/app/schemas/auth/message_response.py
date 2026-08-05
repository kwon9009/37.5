from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """화면에 안내 문구만 돌려주면 되는 응답."""

    message: str = Field(
        description="화면에 그대로 보여줄 안내 문구",
        examples=["비밀번호 재설정 링크를 메일로 보냈습니다."],
    )
