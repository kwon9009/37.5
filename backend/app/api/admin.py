from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse
from app.services import admin_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


@router.get(
    "/hospitals",
    response_model=list[AdminHospitalListItem],
)
def list_hospitals(
    db: Session = Depends(get_db),
):
    return admin_service.get_hospital_list(
        db=db,
    )


@router.get(
    "/names",
    response_model=list[AdminNameResponse],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def get_admin_names(
    db: Session = Depends(get_db),
):
    return admin_service.get_admin_names(
        db=db,
    )
