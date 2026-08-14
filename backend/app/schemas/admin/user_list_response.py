from datetime import datetime

from pydantic import BaseModel


class AdminUserListItem(BaseModel):
    user_id: int
    login_id: str
    name: str
    email: str | None
    role: str
    hospital_name: str | None
    is_super_admin: bool
    is_active: bool
    created_at: datetime
