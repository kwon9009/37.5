from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.crud import alert_crud
from app.schemas.common.message_response import MessageResponse
from app.schemas.alert.alert_list_response import (
    AlertItemResponse,
    AlertListResponse,
)
from app.services import permission_service


# 알림 읽음 처리
def read_alert(
    db: Session,
    user_id: int,
    alert_id: int,
) -> MessageResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    updated = alert_crud.read_alert(
        db=db,
        alert_id=alert_id,
        department_id=department.department_id,
    )

    if updated == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="알림을 찾을 수 없습니다.",
        )

    return MessageResponse(
        message="알림을 읽음 처리했습니다.",
    )


# 알림 목록 조회
def get_alerts(
    db: Session,
    user_id: int,
    is_read: bool | None = None,
) -> AlertListResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    result = alert_crud.get_alerts(
        db=db,
        department_id=department.department_id,
        is_read=is_read,
    )

    alerts = []

    for alert, patient in result["rows"]:

        alerts.append(
            AlertItemResponse(
                alert_id=alert.alert_id,
                patient_name=patient.name,
                room=f"{patient.ward} · {patient.room_num}호 · {patient.bed_num}번",
                message=alert.message,
                status=alert.status,
                is_read=alert.is_read,
                sent_at=alert.sent_at,
            )
        )

    return AlertListResponse(
        total_count=result["total_count"],
        unread_count=result["unread_count"],
        alerts=alerts,
    )


# 모든 알림 읽음 처리
def read_all_alerts(
    db: Session,
    user_id: int,
) -> MessageResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    alert_crud.read_all_alerts(
        db=db,
        department_id=department.department_id,
    )

    return MessageResponse(
        message="모든 알림을 읽음 처리했습니다.",
    )
