from pathlib import Path
import pandas as pd

from app.core.database import SessionLocal
from app.models.hospital import Hospital

db = SessionLocal()

BASE_DIR = Path(__file__).resolve().parent.parent
csv_path = BASE_DIR / "data" / "hospitals.csv"

df = pd.read_csv(csv_path, encoding="utf-8")

for index, row in df.iterrows():

    hospital = Hospital(
        name=row["의료기관명"],
        address=row["주소"],
        bed_count=int(row["병상수"]),
        hospital_code=f"DJ{index+1:03d}",
    )

    db.add(hospital)
print("병원 데이터 추가 완료")
db.commit()
db.close()
