from pydantic import BaseModel


class AdminNameResponse(BaseModel):
    admin_id: int
    name: str
