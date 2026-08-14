from pydantic import BaseModel


class AdminHospitalAdminCreateResponse(BaseModel):
    admin_id: int
    login_id: str
    name: str
    email: str
    phone: str
    hospital_id: int
    hospital_name: str
