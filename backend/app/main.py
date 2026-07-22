"""
FastAPI 진입점 - "동작하는 뼈대" 버전.
지금은 DB 없이 메모리에 최신값만 저장합니다. (나중에 MySQL로 교체)

실행:  uvicorn app.main:app --reload
확인:  http://localhost:8000/docs
"""

import asyncio
import json
from datetime import datetime
import app.models

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.hospital import router as hospital_router
from app.api.hospital_request import router as hospital_request_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(title="37.5 SmartCare API")
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(hospital_router)
app.include_router(hospital_request_router)
app.include_router(dashboard_router)

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
async def receive_vitals(data: dict):
    """라즈베리파이가 1초마다 보내는 생체 데이터 수신."""
    data["received_at"] = datetime.now().isoformat()
    patient_id = data.get("patient_id", "unknown")
    latest_vitals[patient_id] = data
    # TODO: 여기서 이상 감지 -> emergency_logs 저장 -> SMS 발송
    return {"ok": True}


@app.get("/api/stream/{patient_id}")
async def stream(patient_id: str):
    """프론트가 구독하는 실시간 스트림(SSE). 최신값을 1초마다 밀어줌."""

    async def event_generator():
        while True:
            if patient_id in latest_vitals:
                yield {"data": json.dumps(latest_vitals[patient_id])}
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
