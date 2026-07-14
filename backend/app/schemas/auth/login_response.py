from pydantic import BaseModel

from app.models.enums import UserRole


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"

    user_id: int
    role: UserRole
