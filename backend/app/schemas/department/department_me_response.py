from pydantic import BaseModel


class DepartmentMeResponse(BaseModel):
    """로그인한 병원 직원이 어느 병원 · 어느 부서 소속인지.

    병원 화면 상단 바에 병원 이름을 띄우는 데 쓴다. 지금까지는 화면에
    "서울중앙병원"이 고정으로 박혀 있어서, 어느 계정으로 들어가도 같은
    이름이 나왔다.
    """

    department_id: int
    department_name: str
    hospital_id: int
    hospital_name: str
