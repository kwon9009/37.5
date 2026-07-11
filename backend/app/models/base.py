from datetime import datetime

from sqlalchemy import TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BaseModel(Base):
    """
    모든 Entity가 상속받는 공통 모델
    """

    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
