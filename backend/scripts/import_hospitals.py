"""대전 병원 데이터를 공공데이터 CSV에서 읽어 hospitals 테이블에 넣는다.

DB를 처음 만들 때 실행한다. 이미 데이터가 있으면 실행할 필요 없다.

실행 순서 (backend 폴더에서, venv 켠 상태로):
  1) PYTHONPATH=. python scripts/import_hospitals.py       대전 병원
  2) PYTHONPATH=. python scripts/import_mock_hospitals.py  타지역 목업 병원
  3) PYTHONPATH=. python scripts/remove_closed_hospitals.py 폐업 병원 정리

병원 코드는 CSV 줄 번호로 만든다 (1번째 줄 -> DJ001).
  줄 번호를 쓰기 때문에 중간에 건너뛰는 병원이 있어도 뒤 번호는 그대로다.
  코드는 병원이 보호자에게 문자로 보내는 "이름표"라서, 한 번 정해지면 바뀌면 안 된다.

폐업한 병원은 넣지 않는다 (scripts/closed_hospitals.py 참고).

여러 번 실행해도 안전하다. 이미 있는 코드는 건너뛴다.
"""

from pathlib import Path

import pandas as pd
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.hospital import Hospital
from scripts.closed_hospitals import CLOSED_NAMES

# CSV에는 대전 병원만 들어 있어서 지역이 하나로 고정된다.
# 다른 지역 CSV가 생기면 지역도 파일에서 읽도록 바꿔야 한다.
AREA = "대전광역시"


def main():
    base_dir = Path(__file__).resolve().parent.parent
    csv_path = base_dir / "data" / "hospitals.csv"

    df = pd.read_csv(csv_path, encoding="utf-8")

    db = SessionLocal()

    try:
        existing = set(db.scalars(select(Hospital.hospital_code)))

        added = 0
        skipped_closed = 0
        skipped_existing = 0

        for index, row in df.iterrows():
            code = f"DJ{index + 1:03d}"
            name = row["의료기관명"]

            # 폐업한 병원은 넣지 않는다. 번호는 건너뛴 채로 비워둔다.
            if name in CLOSED_NAMES:
                print(f"  건너뜀  {code}  {name} (폐업)")
                skipped_closed += 1
                continue

            if code in existing:
                skipped_existing += 1
                continue

            db.add(
                Hospital(
                    name=name,
                    area=AREA,
                    address=row["주소"],
                    bed_count=int(row["병상수"]),
                    hospital_code=code,
                )
            )
            added += 1

        db.commit()

        print(
            f"\n대전 병원 반영 완료 : 추가 {added}개, "
            f"폐업 제외 {skipped_closed}개, 이미 있음 {skipped_existing}개"
        )

    except Exception as error:
        db.rollback()
        print(f"대전 병원 반영 실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
