"""
FastAPI 진입점.

센서가 보낸 측정값은 MySQL에 저장하고(vital_checks/vital_logs),
동시에 실시간 스트림(SSE)으로 접속 중인 화면에 즉시 밀어줍니다.

실행:  uvicorn app.main:app --reload
확인:  http://localhost:8000/docs
"""

import app.models

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.vitals.vitals_ingest_request import VitalsIngestRequest
from app.services import vital_service
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.hospital import router as hospital_router
from app.api.hospital_request import router as hospital_request_router
from app.api.dashboard import router as dashboard_router
from app.api.patient import router as patient_router
from app.api.alert import router as alert_router
from app.api.guardian import router as guardian_router
from app.api.stream import router as stream_router

app = FastAPI(title="37.5 SmartCare API")
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(hospital_router)
app.include_router(hospital_request_router)
app.include_router(dashboard_router)
app.include_router(patient_router)
app.include_router(alert_router)
app.include_router(guardian_router)
app.include_router(stream_router)

# 프론트(다른 포트)에서 접근 가능하게 CORS 허용 (개발용: 전체 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """서버 살아있는지 확인용."""
    return {"status": "ok"}


@app.post("/api/vitals")
def receive_vitals(
    request: VitalsIngestRequest,
    db: Session = Depends(get_db),
):
    """라즈베리파이가 1초마다 보내는 생체 데이터 수신.

    등급 판정 -> DB 반영 -> 접속 중인 화면에 즉시 방송(SSE)까지 여기서 끝난다.
    """
    result = vital_service.ingest_vitals(db=db, request=request)

    # TODO: DANGER 지속 시 -> alerts/emergency_logs 저장 -> SMS 발송
    return {"ok": True, **result}
