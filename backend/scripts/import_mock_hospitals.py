"""타지역 목업 병원 데이터를 hospitals 테이블에 넣는다.

왜 필요한가:
  실제 데이터는 대전 45개뿐이라, 회원가입 화면에서 지역을 골라도 대전 하나만 나온다.
  지역 선택 기능이 동작하는지 보여주려면 다른 지역 병원도 있어야 한다.

왜 프론트 목업이 아니라 DB에 넣는가:
  병원 코드로 병원을 찾는 API(연동/지도)는 DB를 조회한다.
  프론트에만 있는 병원은 서버가 모르기 때문에 그 병원을 고르면 기능이 전부 멈춘다.
  DB에 넣으면 "데이터만 가짜, 동작은 진짜"가 되어 모든 병원에서 똑같이 동작한다.

아래 병원은 전부 "실재하는 요양병원"이다 (2026-08-08 교체):
  처음에는 그럴듯한 이름과 주소를 지어냈는데, 실재하지 않는 주소라 보호자 앱에서
  지도가 뜨지 않았다. 그래서 카카오 지도에 등록된 병원을 직접 조회해서
  이름·주소를 그대로 가져왔다. 카카오가 아는 곳이므로 지도가 반드시 뜬다.
  (조회에 쓴 도구: 프론트 개발 화면 /dev/hospital-find)

  주소를 손으로 고치지 말 것. 고치면 지도에서 못 찾을 수 있다.
  확인 방법: 개발 화면 /dev/hospital-map 에서 전체 일괄 점검.

지우고 싶을 때 (대전 실제 데이터는 그대로 남는다):
  DELETE FROM hospitals WHERE hospital_code NOT LIKE 'DJ%';

여러 번 실행해도 안전하다. 이미 있는 코드는 내용을 최신으로 맞춘다.
"""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.hospital import Hospital

# (병원코드, 지역, 병원명, 주소, 병상수, 전화번호)
#
# 전화번호는 hospitals 테이블에 아직 컬럼이 없어서 DB에 넣지 못한다.
# 나중에 phone 컬럼이 생기면 바로 쓸 수 있도록 여기에 함께 적어둔다.
MOCK_HOSPITALS = [
    # 서울특별시
    ("SU001", "서울특별시", "강남구립행복요양병원", "서울 강남구 헌릉로590길 60", 180, "02-6053-2114"),
    ("SU002", "서울특별시", "마포요양병원", "서울 마포구 성산로4길 33", 120, "02-337-8111"),
    ("SU003", "서울특별시", "한국효재활요양병원", "서울 은평구 은평로 170", 95, "02-357-0357"),
    ("SU004", "서울특별시", "다나움요양병원", "서울 송파구 가락로 278", 210, "02-412-7272"),
    ("SU005", "서울특별시", "강남수요양병원", "서울 관악구 신림로64길 11", 88, "02-888-8866"),
    # 경기도
    ("GG001", "경기도", "분당센트럴요양병원", "경기 성남시 분당구 양현로94번길 17", 160, "031-706-9090"),
    ("GG002", "경기도", "위더스요양병원", "경기 수원시 팔달구 경수대로 511", 140, "031-239-7227"),
    ("GG003", "경기도", "자애요양병원", "경기 고양시 일산동구 고봉로 20-21", 175, "031-919-9942"),
    ("GG004", "경기도", "더원요양병원", "경기 용인시 기흥구 용구대로 2252", 110, "031-282-8123"),
    ("GG005", "경기도", "성심힐요양병원", "경기 안양시 만안구 안양로 102", 130, "031-441-0153"),
    # 부산광역시
    ("BS001", "부산광역시", "센텀파크요양병원", "부산 해운대구 재반로 137", 155, "051-781-2600"),
    ("BS002", "부산광역시", "수요양병원", "부산 부산진구 동평로 401", 125, "051-750-7000"),
    ("BS003", "부산광역시", "BHS동래한서요양병원", "부산 금정구 중앙대로 1721", 90, "051-509-3000"),
    ("BS004", "부산광역시", "중앙효요양병원", "부산 사하구 낙동대로 565", 105, "051-208-8601"),
    # 대구광역시
    ("DG001", "대구광역시", "안심리더스요양병원", "대구 동구 안심뉴타운2로 77", 145, "053-980-9800"),
    ("DG002", "대구광역시", "황금요양병원", "대구 수성구 수성로 216", 165, "053-765-1111"),
    ("DG003", "대구광역시", "송현효요양병원", "대구 달서구 월배로 384", 100, "053-626-7100"),
    ("DG004", "대구광역시", "대한요양병원", "대구 중구 중앙대로 297", 115, "053-218-8800"),
]


def main():
    db = SessionLocal()

    try:
        rows = db.scalars(select(Hospital)).all()
        by_code = {h.hospital_code: h for h in rows}

        added = 0
        updated = 0
        unchanged = 0

        for code, area, name, address, bed_count, _phone in MOCK_HOSPITALS:
            hospital = by_code.get(code)

            if hospital is None:
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
                print(f"  추가  {code}  {name}")
                continue

            # 이미 있는 병원은 내용이 달라졌을 때만 손댄다
            if (hospital.name, hospital.area, hospital.address) == (name, area, address):
                unchanged += 1
                continue

            print(f"  수정  {code}  {hospital.name} → {name}")
            print(f"        {hospital.address} → {address}")
            hospital.name = name
            hospital.area = area
            hospital.address = address
            updated += 1

        db.commit()

        print(f"\n목업 병원 반영 완료 : 추가 {added}개, 수정 {updated}개, 그대로 {unchanged}개")

        print("\n[지역별 병원 수]")
        for area in sorted({h[1] for h in MOCK_HOSPITALS} | {"대전광역시"}):
            count = len(list(db.scalars(select(Hospital).where(Hospital.area == area))))
            label = "실제" if area == "대전광역시" else "목업(실재 병원 정보)"
            print(f"  {area:<8} {count:>3}개  ({label})")

    except Exception as error:
        db.rollback()
        print(f"목업 병원 반영 실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
