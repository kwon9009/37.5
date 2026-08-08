"""시드 보호자(guardian01~05)의 연동 신청을 지우고 다시 만든다.

왜 필요한가:
  처음 시드는 연동 신청을 만들 때 "환자가 실제로 어느 병원에 있는지"를 보지 않고
  병원을 아무거나 골랐다. 그래서 8건 중 7건이 그 환자가 없는 병원으로 신청된 상태가
  되었고, 병원 화면에서 "일치하는 환자 없음"이 떠서 승인을 해볼 수가 없었다.
  이미 연결이 끝난 사이를 다시 신청한 건도 섞여 있었다.

  seed.py 는 고쳤지만 already_seeded 검사가 있어서 기존 DB에는 반영되지 않는다.
  이 스크립트가 기존 DB를 고친 시드 기준으로 맞춰 준다.

무엇을 지우나:
  시드 계정(guardian01~05)이 낸 연동 신청만 지운다.
  직접 가입해서 테스트한 계정의 신청은 건드리지 않는다.

  연결(patient_guardians)은 지우지 않는다. 보호자가 실제로 보고 있는 환자가
  사라지면 앱이 빈 화면이 된다.

여러 번 실행해도 안전하다.

실행 (backend 폴더에서, venv 켠 상태로):
  PYTHONPATH=. python scripts/reseed_link_requests.py
"""

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.guardian import Guardian
from app.models.patient_link_request import PatientLinkRequest
from app.models.user import User
from scripts.seed import create_patient_link_requests

# 시드로 만들어진 보호자 계정
SEED_LOGIN_IDS = [f"guardian{i:02}" for i in range(1, 6)]


def main():
    db = SessionLocal()

    try:
        guardian_ids = list(
            db.scalars(
                select(Guardian.guardian_id)
                .join(User, User.user_id == Guardian.user_id)
                .where(User.login_id.in_(SEED_LOGIN_IDS))
            )
        )

        if not guardian_ids:
            print("시드 보호자 계정을 찾지 못했습니다. 먼저 seed.py 를 실행해 주세요.")
            return

        removed = db.execute(
            delete(PatientLinkRequest).where(
                PatientLinkRequest.guardian_id.in_(guardian_ids)
            )
        ).rowcount
        db.commit()

        print(f"기존 시드 연동 신청 {removed}건 삭제")

        create_patient_link_requests(db)

        print("\n[다시 만든 연동 신청]")
        for request in db.scalars(
            select(PatientLinkRequest).order_by(PatientLinkRequest.request_id)
        ):
            print(
                f"  REQ-{request.request_id:<3} "
                f"{request.patient_name:<5} {request.relation:<4} "
                f"{request.status.value:<9} {request.hospital.name}"
            )

    except Exception as error:
        db.rollback()
        print(f"실패 : {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
