from pydantic import BaseModel, EmailStr, Field


class AdminHospitalAdminCreateRequest(BaseModel):
    login_id: str = Field(..., min_length=4, max_length=30)
    password: str = Field(..., min_length=4, max_length=100)
    name: str = Field(..., min_length=2, max_length=20)
    email: EmailStr
    phone: str = Field(..., min_length=9, max_length=20)
