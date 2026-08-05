from pydantic import BaseModel, EmailStr, Field


class FindIdRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=20,
        description="가입할 때 입력한 이름",
        examples=["홍길동"],
    )

    email: EmailStr = Field(
        ...,
        description="가입할 때 입력한 이메일",
        examples=["guardian01@example.com"],
    )
