from pydantic import BaseModel, Field


class DepartmentPasswordChangeRequest(BaseModel):
    current_password: str

    new_password: str = Field(
        min_length=4,
        max_length=100,
    )
