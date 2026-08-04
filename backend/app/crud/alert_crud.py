from sqlalchemy import update, func
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.patient import Patient


# 알림 읽음 처리
def read_alert(
    db: Session,
    alert_id: int,
    department_id: int,
):

    stmt = (
        update(Alert)
        .where(
            Alert.alert_id == alert_id,
            Alert.department_id == department_id,
        )
        .values(
            is_read=True,
        )
    )

    result = db.execute(stmt)

    db.commit()

    return result.rowcount


# 알림 목록 조회
def get_alerts(
    db: Session,
    department_id: int,
    is_read: bool | None = None,
):

    query = (
        db.query(
            Alert,
            Patient,
        )
        .join(
            Patient,
            Alert.patient_id == Patient.patient_id,
        )
        .filter(
            Alert.department_id == department_id,
        )
    )

    if is_read is not None:
        query = query.filter(
            Alert.is_read == is_read,
        )

    rows = query.order_by(
        Alert.sent_at.desc(),
    ).all()

    total_count = (
        db.query(func.count(Alert.alert_id))
        .filter(
            Alert.department_id == department_id,
        )
        .scalar()
    )

    unread_count = (
        db.query(func.count(Alert.alert_id))
        .filter(
            Alert.department_id == department_id,
            Alert.is_read.is_(False),
        )
        .scalar()
    )

    return {
        "rows": rows,
        "total_count": total_count,
        "unread_count": unread_count,
    }


# 모든 알림 읽음 처리
def read_all_alerts(
    db: Session,
    department_id: int,
):

    stmt = (
        update(Alert)
        .where(
            Alert.department_id == department_id,
            Alert.is_read.is_(False),
        )
        .values(is_read=True)
    )

    db.execute(stmt)
    db.commit()
