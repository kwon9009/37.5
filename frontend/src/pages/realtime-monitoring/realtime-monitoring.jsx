import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import { apiClient } from "../../api/client.js";
import { openVitalStream } from "../../api/vital-stream.js";

const LEGEND = [
  { label: "응급", color: "#E0442E" },
  { label: "경고", color: "#E8762B" },
  { label: "주의", color: "#E8A13B" },
  { label: "정상", color: "#2FA35C" },
];

// 서버 등급(NEWS2 판정 결과) -> 화면 심각도. SSE 스트림은 대문자 enum 값을 그대로 보낸다.
const SEVERITY_BY_STATUS = {
  NORMAL: "normal",
  WARNING: "warning",
  ALERT: "caution",
  DANGER: "emergency",
};

// 스트림이 살아있으면 느리게, 끊겼으면 빠르게 다시 불러온다(폴백)
const POLL_SLOW_MS = 30000;
const POLL_FAST_MS = 5000;

const CARD_STYLE = {
  emergency: { background: "#FDEDEA", borderColor: "#E0442E", borderWidth: 2 },
  offline: { background: "#EDF1F6", borderColor: "#DCE3EC", borderWidth: 1 },
};

// GET /dashboard/patients의 room은 "3층 A병동 · 305호 · 2번" 형태라 앞부분이 병동명이다.
function wardOf(room) {
  return room?.split(" · ")[0] ?? "미배정";
}

function toMonitorPatient(item) {
  const isOffline = item.sensor_status !== "연결됨";
  return {
    id: item.patient_id,
    name: item.name,
    room: item.room,
    ward: wardOf(item.room),
    severity: isOffline ? "offline" : item.severity,
    heartRate: item.heart_rate,
    respirationRate: item.respiration_rate,
    connected: !isOffline,
    sensorStatus: item.sensor_status,
  };
}

function formatWardClock(date) {
  const datePart = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
  const timePart = date.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function MonitorCard({ patient }) {
  const navigate = useNavigate();
  const style = CARD_STYLE[patient.severity] ?? { background: "#FFFFFF", borderColor: "#DCE3EC", borderWidth: 1 };
  const valueColor = patient.severity === "emergency" ? "#E0442E" : "#1E2A3A";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${patient.name} 상세 보기`}
      onClick={() => navigate(`/patients/${patient.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/patients/${patient.id}`);
        }
      }}
      className="flex cursor-pointer flex-col gap-[14px] rounded-xl p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(30,42,58,0.16)]"
      style={{ backgroundColor: style.background, borderColor: style.borderColor, borderWidth: style.borderWidth, borderStyle: "solid" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-[3px]">
          <p className={`text-base font-bold ${patient.severity === "offline" ? "text-[#5A6B80]" : "text-[#1E2A3A]"}`}>
            {patient.name}
          </p>
          <p className="text-xs text-[#5A6B80]">{patient.room}</p>
        </div>
        <StatusBadge severity={patient.severity} />
      </div>

      {patient.severity === "offline" ? (
        <div className="flex items-center justify-center gap-2 py-[18px]">
          <Icon name="wifi-off" size={20} className="text-[#5A6B80]" />
          <span className="text-sm font-bold text-[#5A6B80]">센서 확인 필요</span>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center gap-[5px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
              <Icon name="heart-pulse" size={13} />
              심박
            </div>
            <div className="flex items-end gap-[3px]">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: valueColor }}>
                {patient.heartRate}
              </span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">bpm</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center gap-[5px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
              <Icon name="wind" size={13} />
              호흡
            </div>
            <div className="flex items-end gap-[3px]">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: valueColor }}>
                {patient.respirationRate}
              </span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">회/분</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-[10px] border-t border-[#DCE3EC] pt-[10px]">
        <div className="flex items-center gap-[5px]">
          <Icon name={patient.connected ? "wifi" : "wifi-off"} size={13} className={patient.connected ? "text-[#2FA35C]" : "text-[#5A6B80]"} />
          <span className="text-[11px] text-[#5A6B80]">{patient.sensorStatus ?? (patient.connected ? "연결됨" : "연결 끊김")}</span>
        </div>
      </div>
    </div>
  );
}

function RealtimeMonitoring() {
  const [activeWard, setActiveWard] = useState("전체");
  const [now, setNow] = useState(() => new Date());
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [realtime, setRealtime] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      try {
        const { data } = await apiClient.get("/dashboard/patients");
        if (cancelled) return;
        setError("");
        setPatients(data.map(toMonitorPatient));
      } catch {
        if (!cancelled) setError("환자 목록을 불러오지 못했습니다.");
      }
    }

    loadPatients();
    const timer = setInterval(loadPatients, realtime ? POLL_SLOW_MS : POLL_FAST_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [realtime]);

  // 심박·호흡은 서버가 값을 받는 즉시 밀어준다(폴링 간격을 기다리지 않음)
  useEffect(() => {
    return openVitalStream({
      scope: "department",
      onVitals: (payload) => {
        setPatients((prev) =>
          prev.map((patient) =>
            patient.id !== payload.patient_id
              ? patient
              : {
                  ...patient,
                  heartRate: payload.heart_rate ?? patient.heartRate,
                  respirationRate: payload.resp_rate ?? patient.respirationRate,
                  severity: patient.connected ? (SEVERITY_BY_STATUS[payload.status] ?? patient.severity) : patient.severity,
                },
          ),
        );
      },
      onConnectionChange: setRealtime,
    });
  }, []);

  const wardTabs = useMemo(() => {
    const counts = patients.reduce((acc, patient) => {
      acc[patient.ward] = (acc[patient.ward] ?? 0) + 1;
      return acc;
    }, {});
    return [
      { name: "전체", count: patients.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [patients]);

  const wardPatients = useMemo(() => {
    const filtered = activeWard === "전체" ? patients : patients.filter((patient) => patient.ward === activeWard);
    const order = { emergency: 0, warning: 1, caution: 2, normal: 3, offline: 4 };
    return [...filtered].sort((a, b) => order[a.severity] - order[b.severity]);
  }, [patients, activeWard]);

  return (
    <div className="realtime-monitoring flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="monitoring" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">실시간 모니터링{activeWard !== "전체" ? ` · ${activeWard}` : ""}</h1>
              <p className="text-[13px] text-[#5A6B80]">위험 환자 우선 정렬 · 자동 갱신</p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${realtime ? "bg-[#2FA35C]" : "bg-[#E8A13B]"}`} aria-hidden="true" />
                <span className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  {realtime ? "실시간 연결됨" : "재연결 중"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-[14px] py-2">
                <Icon name="clock-3" size={15} className="text-[#5A6B80]" />
                <span className="text-[13px] font-semibold text-[#1E2A3A]">{formatWardClock(now)}</span>
              </div>

              <div className="flex items-center gap-4">
                {LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-[6px]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-[#5A6B80]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[#FDEDEA] px-3 py-2 text-xs font-semibold text-[#E0442E]">{error}</p>
          )}

          <div className="flex flex-wrap items-center gap-[10px]">
            {wardTabs.map((ward) => {
              const isActive = ward.name === activeWard;
              return (
                <button
                  key={ward.name}
                  type="button"
                  onClick={() => setActiveWard(ward.name)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-[10px] text-sm font-semibold ${
                    isActive ? "border-[#DCE3EC] bg-[#2B6FE3] text-white" : "border-[#DCE3EC] bg-white text-[#1E2A3A]"
                  }`}
                >
                  {ward.name}
                  <span
                    className={`rounded-full px-2 py-[2px] text-xs font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#EDF1F6] text-[#5A6B80]"
                    }`}
                  >
                    {ward.count}
                  </span>
                </button>
              );
            })}
          </div>

          {wardPatients.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {wardPatients.map((patient) => (
                <MonitorCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE3EC] bg-white p-10 text-center shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
              <p className="text-sm font-semibold text-[#5A6B80]">해당 병동에 모니터링 중인 환자가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealtimeMonitoring;
