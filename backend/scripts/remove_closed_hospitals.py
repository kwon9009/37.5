"""이미 DB에 들어가 있는 폐업 병원을 지운다.

왜 필요한가:
  대전 45개는 공공데이터에서 가져온 실제 병원인데, 그중 일부는 그 뒤에 폐업했다.
  폐업한 병원이 목록에 남아 있으면 보호자가 그 병원으로 연동 신청을 하게 된다.

  import_hospitals.py 는 이제 폐업 병원을 아예 넣지 않는다.
  그래서 이 스크립트는 "그 전에 만들어진 DB"를 정리하는 용도다.
  DB를 새로 만드는 경우에는 지울 것이 없어서 그냥 넘어간다.

어느 병원이 폐업인지는 scripts/closed_hospitals.py 에 적어둔다.

주의:
  외래키 때문에 병원을 참조하는 행을 먼저 지워야 한다.
  지금은 그 대상이 전부 시드(테스트) 데이터임을 확인하고 지운다.
  실제 환자 연동 데이터가 쌓인 뒤에는 이 스크립트를 그대로 쓰면 안 된다.

여러 번 실행해도 안전하다. 이미 없으면 건너뛴다.
"""

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.admin_hospital import AdminHospital
from app.models.hospital import Hospital
from app.models.patient_link_request import PatientLinkRequest
from scripts.closed_hospitals import CLOSED_CODES as CLOSED_HOSPITAL_CODES


def main():
    db = SessionLocal()

    try:
        removed = 0

        for code in CLOSED_HOSPITAL_CODES:
            hospital = db.scalar(select(Hospital).where(Hospital.hospital_code == code))

            if hospital is None:
                print(f"  건너뜀  {code} : 이미 없음")
                continue

            hospital_id = hospital.hospital_id
            print(f"  삭제  {code}  {hospital.name}")
            print(f"        {hospital.address}")

            # 이 병원을 참조하는 행부터 지운다 (외래키 제약)
            link_count = db.execute(
                delete(PatientLinkRequest).where(
                    PatientLinkRequest.hospital_id == hospital_id
                )
            ).rowcount
            admin_count = db.execute(
                delete(AdminHospital).where(AdminHospital.hospital_id == hospital_id)
            ).rowcount

            print(f"        연동신청 {link_count}건, 관리자배정 {admin_count}건 함께 삭제")

            db.delete(hospital)
            removed += 1

        db.commit()

        total = len(list(db.scalars(select(Hospital))))
        print(f"\n폐업 병원 삭제 완료 : {removed}개 삭제, 남은 병원 {total}개")

    except Exception as error:
        db.rollback()
        print(f"폐업 병원 삭제 실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
