from pydantic import BaseModel


class DepartmentMeResponse(BaseModel):
    """로그인한 병원 직원의 소속 및 계정 정보."""

    department_id: int
    department_name: str
    hospital_id: int
    hospital_name: str
    email: str | None
    profile_image_url: str | None
