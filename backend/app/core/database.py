from sqlalchemy import create_engine
from typing import Generator
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.settings import settings

# Engine 생성
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

# Session 생성
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)


# 모든 Model이 상속받는 Base
class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
