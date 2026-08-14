from pydantic import BaseModel


class AdminUserStatusUpdateRequest(BaseModel):
    is_active: bool
