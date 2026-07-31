"""
FastAPI 진입점.

센서가 보낸 측정값은 MySQL에 저장하고(vital_checks/vital_logs),
SSE 스트림용 최신값만 메모리에 함께 들고 있습니다.

실행:  uvicorn app.main:app --reload
확인:  http://localhost:8000/docs
"""

import asyncio
import json
from datetime import datetime
import app.models

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
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

app = FastAPI(title="37.5 SmartCare API")
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(hospital_router)
app.include_router(hospital_request_router)
app.include_router(dashboard_router)
app.include_router(patient_router)
app.include_router(alert_router)
app.include_router(guardian_router)

# 프론트(다른 포트)에서 접근 가능하게 CORS 허용 (개발용: 전체 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환자별 최신 생체값 저장소 (뼈대용 임시 메모리)
latest_vitals: dict[str, dict] = {}


@app.get("/health")
def health():
    """서버 살아있는지 확인용."""
    return {"status": "ok"}


@app.post("/api/vitals")
def receive_vitals(
    request: VitalsIngestRequest,
    db: Session = Depends(get_db),
):
    """라즈베리파이가 1초마다 보내는 생체 데이터 수신 -> 등급 판정 후 DB 반영."""
    result = vital_service.ingest_vitals(db=db, request=request)

    # SSE 구독자에게 밀어줄 최신값 (메모리)
    latest_vitals[str(request.patient_id)] = {
        **request.model_dump(mode="json"),
        "status": result["status"],
        "received_at": datetime.now().isoformat(),
    }

    # TODO: DANGER 지속 시 -> alerts/emergency_logs 저장 -> SMS 발송
    return {"ok": True, **result}


@app.get("/api/stream/{patient_id}")
async def stream(patient_id: str):
    """프론트가 구독하는 실시간 스트림(SSE). 최신값을 1초마다 밀어줌."""

    async def event_generator():
        while True:
            if patient_id in latest_vitals:
                yield {"data": json.dumps(latest_vitals[patient_id])}
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
