import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.crud import user_crud
from app.models.user import User
from app.schemas.department.department_me_response import DepartmentMeResponse
from app.services import permission_service


# 로그인한 부서 계정 정보 조회
# 로그인한 부서 계정 정보 조회
def get_my_department(
    db: Session,
    user_id: int,
) -> DepartmentMeResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    user = user_crud.get_by_user_id(
        db=db,
        user_id=user_id,
    )

    return DepartmentMeResponse(
        department_id=department.department_id,
        department_name=department.name,
        hospital_id=department.hospital_id,
        hospital_name=department.hospital.name,
        email=user.email,
        profile_image_url=user.profile_image_url,
    )


# 비밀번호 변경
def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
) -> None:
    if not verify_password(current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )

    hashed_password = hash_password(new_password)

    user_crud.update_password(
        db=db,
        user=user,
        password=hashed_password,
    )


# 프로필 이미지 변경
async def change_profile_image(
    db: Session,
    user: User,
    file: UploadFile,
) -> str:
    allowed_content_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.",
        )

    max_size = 5 * 1024 * 1024

    file_data = await file.read()

    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="프로필 이미지는 5MB 이하만 업로드할 수 있습니다.",
        )

    extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }[file.content_type]

    filename = f"{user.user_id}_{uuid.uuid4().hex}{extension}"

    upload_dir = Path("uploads/profile")
    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = upload_dir / filename

    with open(file_path, "wb") as image_file:
        image_file.write(file_data)

    profile_image_url = f"/uploads/profile/{filename}"

    # 기존 프로필 이미지 경로 저장
    old_profile_image_url = user.profile_image_url

    # DB의 프로필 이미지 경로 변경
    user_crud.update_profile_image(
        db=db,
        user=user,
        profile_image_url=profile_image_url,
    )

    # 기존 프로필 이미지 삭제
    if old_profile_image_url:
        old_file_path = Path(old_profile_image_url.lstrip("/"))

        if old_file_path.exists():
            old_file_path.unlink()

    return profile_image_url
