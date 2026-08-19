"""[임시 개발용] MySQL 접속이 막혔을 때 SQLite로 스키마를 만들어 준다.

DDL.sql 은 MySQL 문법이라 SQLite에 그대로 못 넣는다. 대신 SQLAlchemy 모델에서
테이블을 만들어 낸다.

주의: SQLite 는 BIGINT 기본키를 자동 증가시키지 않는다(INTEGER 기본키만 rowid 별칭이 된다).
     그래서 만들기 직전에 기본키 타입만 INTEGER 로 바꿔 준다. 모델 파일은 건드리지 않는다.

  DATABASE_URL=sqlite:///./dev.db python scripts/_dev_sqlite_tables.py
"""
from sqlalchemy import BigInteger, Integer

from app.core.database import Base, engine
import app.models  # noqa: F401  (모델을 전부 import 해야 메타데이터에 등록된다)

if engine.dialect.name == "sqlite":
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, BigInteger):
                column.type = Integer()

Base.metadata.create_all(engine)
print("테이블 생성 완료:", len(Base.metadata.tables), "개 ->", engine.url)
