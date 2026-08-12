"""전화번호가 비어 있는 병원의 대표번호를 카카오 지도에서 찾아 채운다.

왜 필요한가:
  보호자 앱의 "병원 연락하기" 버튼이 병원 대표번호로 전화를 건다.
  대전 44곳은 원본 CSV(의료기관명·주소·병상수)에 번호가 없어서 비어 있다.
  카카오 로컬 API가 장소 정보와 함께 대표번호를 주므로 그걸로 채운다.

잘못된 번호를 넣지 않기 위한 확인:
  이름이 비슷하다고 아무 번호나 넣으면 보호자가 엉뚱한 곳에 전화를 건다.
  그래서 카카오가 찾아준 장소의 주소가 우리 DB 주소와 같은 구(區)인지
  확인하고, 다르면 넣지 않고 넘어간다.

여러 번 실행해도 안전하다. 이미 번호가 있는 병원은 건드리지 않는다.

실행 (backend 폴더에서, venv 켠 상태로):
  PYTHONPATH=. python scripts/fill_hospital_phones.py          # 실제로 채움
  PYTHONPATH=. python scripts/fill_hospital_phones.py --dry    # 확인만
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from dotenv import load_dotenv
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.hospital import Hospital

load_dotenv()

KAKAO_KEY = os.getenv("KAKAO_REST_API_KEY", "").strip()
SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

# 카카오 쪽에 부담을 주지 않도록 호출 사이에 잠깐 쉰다
DELAY_SEC = 0.25


def district(address: str) -> str:
    """주소에서 구·군·시를 뽑는다. 첫 낱말(시·도)은 건너뛴다."""
    tokens = address.split()[1:]

    for token in tokens:
        if token.endswith("구"):
            return token

    for token in tokens:
        if token.endswith(("시", "군")):
            return token

    return ""


def normalize(name: str) -> str:
    """비교·검색용으로 이름에서 법인 수식어와 공백을 걷어낸다.

    "사회복지법인 금성복지재단 보광노인전문병원" -> "보광노인전문병원"

    카카오는 법인명까지 붙은 정식 명칭으로는 잘 못 찾고, 간판에 적힌
    이름으로 찾는다. 그래서 검색어를 만들 때도 이 함수를 쓴다.
    """
    text = re.sub(
        r"(의료법인|의\)|사회복지법인|재단법인|학교법인"
        r"|[가-힣]*의료재단|[가-힣]*복지재단|[가-힣]*의료소비자생활협동조합)",
        "",
        name,
    )
    return re.sub(r"\s+", "", text)


def search(query: str) -> list[dict]:
    url = f"{SEARCH_URL}?query={urllib.parse.quote(query)}&size=5"
    request = urllib.request.Request(
        url, headers={"Authorization": f"KakaoAK {KAKAO_KEY}"}
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response).get("documents", [])


def find_phone(hospital: Hospital) -> tuple[str | None, str]:
    """(찾은 번호, 사유). 못 찾으면 (None, 사유)."""
    want_district = district(hospital.address)
    want_name = normalize(hospital.name)

    # 정식 명칭 -> 법인명 뗀 이름 -> 구를 붙인 이름 순으로 시도한다.
    # 카카오는 "사회복지법인 금성복지재단 보광노인전문병원"으로는 못 찾고
    # "보광노인전문병원"으로는 찾는 경우가 많다.
    queries = [hospital.name, want_name, f"{want_district} {want_name}"]

    for query in dict.fromkeys(q for q in queries if q):
        try:
            documents = search(query)
        except Exception as error:
            return None, f"조회 실패: {str(error)[:40]}"

        for doc in documents:
            place_address = doc.get("road_address_name") or doc.get("address_name") or ""

            # 같은 구가 아니면 동명이 다른 병원이다
            if want_district and district(place_address) != want_district:
                continue

            # 이름이 서로 포함 관계일 때만 같은 병원으로 본다
            place_name = normalize(doc.get("place_name", ""))
            if want_name not in place_name and place_name not in want_name:
                continue

            phone = (doc.get("phone") or "").strip()

            if phone:
                return phone, doc.get("place_name", "")

            return None, "카카오에 번호 없음"

        time.sleep(DELAY_SEC)

    return None, "일치하는 장소 없음"


def main() -> None:
    dry_run = "--dry" in sys.argv

    if not KAKAO_KEY:
        print("KAKAO_REST_API_KEY가 .env에 없습니다.")
        return

    db = SessionLocal()

    try:
        targets = list(
            db.scalars(
                select(Hospital)
                .where(Hospital.phone.is_(None))
                .order_by(Hospital.hospital_id)
            )
        )

        if not targets:
            print("전화번호가 비어 있는 병원이 없습니다.")
            return

        print(f"전화번호가 빈 병원 {len(targets)}곳을 찾습니다.")
        print("(--dry 를 붙이면 저장하지 않고 결과만 봅니다)" if not dry_run else "(확인만 하고 저장하지 않습니다)")
        print()

        filled = 0
        failed: list[tuple[str, str]] = []

        for hospital in targets:
            phone, note = find_phone(hospital)

            if phone:
                if not dry_run:
                    hospital.phone = phone
                filled += 1
                print(f"  찾음   {hospital.hospital_code} {hospital.name[:22]:24} {phone}")
            else:
                failed.append((hospital.name, note))
                print(f"  못찾음 {hospital.hospital_code} {hospital.name[:22]:24} ({note})")

            time.sleep(DELAY_SEC)

        if not dry_run:
            db.commit()

        print()
        print(f"채운 병원 {filled}곳 / 못 찾은 병원 {len(failed)}곳")

        if failed:
            print()
            print("못 찾은 곳은 병원 홈페이지나 건강보험심사평가원에서 직접 확인해 주세요:")
            for name, note in failed:
                print(f"  - {name} ({note})")

        if dry_run:
            print()
            print("확인만 했습니다. 실제로 채우려면 --dry 없이 다시 실행해 주세요.")

    except Exception as error:
        db.rollback()
        print(f"실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
