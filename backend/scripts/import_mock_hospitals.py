"""타지역 목업 병원 데이터를 hospitals 테이블에 넣는다.

왜 필요한가:
  실제 데이터는 대전 45개뿐이라, 회원가입 화면에서 지역을 골라도 대전 하나만 나온다.
  지역 선택 기능이 동작하는지 보여주려면 다른 지역 병원도 있어야 한다.

왜 프론트 목업이 아니라 DB에 넣는가:
  병원 코드로 병원을 찾는 API(연동/지도)는 DB를 조회한다.
  프론트에만 있는 병원은 서버가 모르기 때문에 그 병원을 고르면 기능이 전부 멈춘다.
  DB에 넣으면 "데이터만 가짜, 동작은 진짜"가 되어 모든 병원에서 똑같이 동작한다.

지우고 싶을 때 (대전 실제 데이터는 그대로 남는다):
  DELETE FROM hospitals WHERE hospital_code NOT LIKE 'DJ%';

여러 번 실행해도 안전하다. 이미 있는 코드는 건너뛴다.
"""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.hospital import Hospital

# (병원코드, 지역, 병원명, 주소, 병상수)
MOCK_HOSPITALS = [
    # 서울특별시
    ("SU001", "서울특별시", "서울열림요양병원", "서울특별시 강남구 테헤란로 152", 180),
    ("SU002", "서울특별시", "한강실버요양병원", "서울특별시 마포구 월드컵북로 400", 120),
    ("SU003", "서울특별시", "북한산참사랑요양병원", "서울특별시 은평구 통일로 1050", 95),
    ("SU004", "서울특별시", "송파온누리요양병원", "서울특별시 송파구 올림픽로 300", 210),
    ("SU005", "서울특별시", "관악해맑은요양병원", "서울특별시 관악구 남부순환로 1820", 88),
    # 경기도
    ("GG001", "경기도", "분당푸른요양병원", "경기도 성남시 분당구 판교역로 235", 160),
    ("GG002", "경기도", "수원늘봄요양병원", "경기도 수원시 팔달구 효원로 1", 140),
    ("GG003", "경기도", "고양행복요양병원", "경기도 고양시 일산동구 중앙로 1275", 175),
    ("GG004", "경기도", "용인미소요양병원", "경기도 용인시 기흥구 중부대로 345", 110),
    ("GG005", "경기도", "안양편안요양병원", "경기도 안양시 동안구 시민대로 235", 130),
    # 부산광역시
    ("BS001", "부산광역시", "해운대바다요양병원", "부산광역시 해운대구 센텀중앙로 90", 155),
    ("BS002", "부산광역시", "부산진온정요양병원", "부산광역시 부산진구 중앙대로 749", 125),
    ("BS003", "부산광역시", "금정산맑은요양병원", "부산광역시 금정구 중앙대로 1777", 90),
    ("BS004", "부산광역시", "사하하나요양병원", "부산광역시 사하구 낙동대로 1240", 105),
    # 대구광역시
    ("DG001", "대구광역시", "팔공산든든요양병원", "대구광역시 동구 팔공로 123", 145),
    ("DG002", "대구광역시", "수성참좋은요양병원", "대구광역시 수성구 달구벌대로 2450", 165),
    ("DG003", "대구광역시", "달서한마음요양병원", "대구광역시 달서구 성서로 200", 100),
    ("DG004", "대구광역시", "대구중앙실버요양병원", "대구광역시 중구 국채보상로 680", 115),
]


def main():
    db = SessionLocal()

    try:
        existing = set(db.scalars(select(Hospital.hospital_code)))

        added = 0
        skipped = 0

        for code, area, name, address, bed_count in MOCK_HOSPITALS:
            if code in existing:
                skipped += 1
                continue

            db.add(
                Hospital(
                    name=name,
                    area=area,
                    address=address,
                    hospital_code=code,
                    bed_count=bed_count,
                )
            )
            added += 1

        db.commit()

        print(f"목업 병원 추가 완료 : {added}개 추가, {skipped}개 건너뜀(이미 있음)")

        print("\n[지역별 병원 수]")
        for area in sorted({h[1] for h in MOCK_HOSPITALS} | {"대전광역시"}):
            count = len(list(db.scalars(select(Hospital).where(Hospital.area == area))))
            label = "실제" if area == "대전광역시" else "목업"
            print(f"  {area:<8} {count:>3}개  ({label})")

    except Exception as error:
        db.rollback()
        print(f"목업 병원 추가 실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
