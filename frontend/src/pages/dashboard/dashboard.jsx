import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import PatientCard from "../../components/patient-card/patient-card.jsx";
import Icon from "../../components/icon/icon.jsx";
import EmergencyScreeningOverlay from "../../components/emergency-screening-overlay/emergency-screening-overlay.jsx";
import { apiClient } from "../../api/client.js";
import { openVitalStream } from "../../api/vital-stream.js";

const SEVERITY_ORDER = { emergency: 0, warning: 1, caution: 2, normal: 3 };

// 서버 등급(NEWS2 판정 결과) -> 화면 심각도
const SEVERITY_BY_STATUS = {
  NORMAL: "normal",
  WARNING: "warning",
  ALERT: "caution",
  DANGER: "emergency",
};

// 심박·호흡은 실시간 스트림(SSE)으로 즉시 받는다.
// 아래 간격은 알림 목록처럼 스트림으로 오지 않는 나머지 데이터를 다시 불러오는 주기다.
//  - 스트림이 살아있으면 느리게(서버 부담 줄이기)
//  - 스트림이 끊기면 빠르게(폴링만으로 버티기 = 폴백)
const POLL_SLOW_MS = 30000;
const POLL_FAST_MS = 5000;

function sortBySeverity(list) {
  return [...list].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

const KPI_META = [
  { key: "all", label: "전체 환자", color: "#1E2A3A", bg: "#FFFFFF" },
  { key: "normal", label: "정상", color: "#2FA35C", bg: "#FFFFFF" },
  { key: "caution", label: "주의", color: "#E8A13B", bg: "#FFFFFF" },
  { key: "warning", label: "경고", color: "#E8762B", bg: "#FFFFFF" },
  { key: "emergency", label: "응급", color: "#E0442E", bg: "#FDEDEA" },
];

function formatClock(date) {
  return date.toLocaleTimeString("ko-KR", { hour12: false });
}

function toClockString(isoString) {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "" : formatClock(date);
}

function ListPanel({ title, count, items }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex items-center justify-between border-b border-[#DCE3EC] px-4 py-[14px]">
        <p className="text-xs font-bold tracking-wide text-[#1E2A3A]">{title}</p>
        {count != null && (
          <span className="rounded-full border border-[#DCE3EC] bg-[#EDF1F6] px-[9px] py-[3px] text-[11px] font-bold text-[#5A6B80]">
            {count}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <div
            key={item.name + item.detail}
            className="flex items-center gap-3 border-b border-[#DCE3EC] px-4 py-[14px] last:border-b-0"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="truncate text-sm font-semibold text-[#1E2A3A]">{item.name}</p>
              <p className="truncate text-xs text-[#5A6B80]">{item.detail}</p>
            </div>
            <button
              type="button"
              aria-label={`${item.name} 자세히 보기`}
              onClick={() => navigate(item.path)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2B6FE3]"
            >
              <Icon name="chevron-right" size={16} className="text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);
  const [screeningEnabled, setScreeningEnabled] = useState(false);
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [realtime, setRealtime] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [summaryRes, patientsRes, alertsRes] = await Promise.all([
          apiClient.get("/dashboard/summary"),
          apiClient.get("/dashboard/patients"),
          apiClient.get("/dashboard/recent-alerts"),
        ]);

        if (cancelled) return;

        setError("");          // 일시적 오류 뒤 복구되면 경고를 지운다
        setSummary(summaryRes.data);

        setPatients(
          sortBySeverity(
            patientsRes.data.map((patient) => ({
              id: patient.patient_id,
              name: patient.name,
              room: patient.room,
              presenceLabel: patient.presence_label,
              severity: patient.severity,
              heartRate: patient.heart_rate,
              respirationRate: patient.respiration_rate,
              sensorStatus: patient.sensor_status,
              timestamp: toClockString(patient.timestamp),
            })),
          ),
        );

        setAlerts(
          alertsRes.data.map((alert) => ({
            name: `${alert.patient_name} · ${alert.room}`,
            detail: `${alert.message} · ${toClockString(alert.sent_at)}`,
            color: alert.is_read ? "#5A6B80" : "#E0442E",
            path: `/patients/${encodeURIComponent(alert.patient_name)}`,
          })),
        );
      } catch {
        if (!cancelled) setError("대시보드 데이터를 불러오지 못했습니다.");
      }
    }

    loadDashboard();
    // 스트림이 살아있으면 느리게, 끊겼으면 빠르게 다시 불러온다
    const timer = setInterval(loadDashboard, realtime ? POLL_SLOW_MS : POLL_FAST_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [realtime]);

  // 우리 부서 환자들의 심박·호흡을 서버가 값을 받는 즉시 받아본다(폴링 간격을 기다리지 않음)
  useEffect(() => {
    return openVitalStream({
      scope: "department",
      onVitals: (payload) => {
        setPatients((prev) =>
          sortBySeverity(
            prev.map((patient) =>
              patient.id !== payload.patient_id
                ? patient
                : {
                    ...patient,
                    // null이면 "이번엔 갱신할 값이 없음"(부재중·안정화중·측정오류)이라
                    // 직전 값을 그대로 유지한다
                    heartRate: payload.heart_rate ?? patient.heartRate,
                    respirationRate: payload.resp_rate ?? patient.respirationRate,
                    severity: SEVERITY_BY_STATUS[payload.status] ?? patient.severity,
                    presenceLabel: payload.presence ? "재실중" : "부재중",
                    timestamp: toClockString(payload.measured_at),
                  },
            ),
          ),
        );
      },
      onConnectionChange: setRealtime,
    });
  }, []);

  useEffect(() => {
    // 실시간 감지 이벤트를 흉내내기 위한 지연 (실제로는 SSE로 응급 이벤트 수신 시 즉시 트리거)
    // 시연용으로 10초 지연 (요청 사항)
    const timeout = setTimeout(() => setScreeningEnabled(true), 10000);
    return () => clearTimeout(timeout);
  }, []);

  // 등급별 인원은 화면에 떠 있는 환자 카드에서 직접 센다.
  // 스트림으로 등급이 바뀌었을 때 KPI 숫자와 카드 목록이 어긋나지 않게 하려는 것.
  // (전체 인원은 센서가 없는 환자도 포함하므로 서버 요약값을 그대로 쓴다)
  const severityCounts = patients.reduce((acc, patient) => {
    acc[patient.severity] = (acc[patient.severity] ?? 0) + 1;
    return acc;
  }, {});

  const kpis = KPI_META.map((meta) => ({
    ...meta,
    value:
      meta.key === "all"
        ? (summary?.total_patients ?? patients.length)
        : (severityCounts[meta.key] ?? 0),
  }));

  const emergencyEvents = patients
    .filter((patient) => patient.severity === "emergency")
    .map((patient) => ({
      name: `${patient.name} · ${patient.room}`,
      detail: `응급 상태 감지 · ${patient.timestamp}`,
      color: "#E0442E",
      path: `/patients/${patient.id}`,
    }));

  const visiblePatients =
    activeFilter === "all" ? patients : patients.filter((patient) => patient.severity === activeFilter);

  const screeningPatient =
    screeningEnabled && !emergencyDismissed
      ? patients.find((patient) => patient.severity === "emergency")
      : undefined;

  const handleAcknowledge = () => {
    setEmergencyDismissed(true);
  };

  const handleRespond = () => {
    const id = screeningPatient.id;
    setEmergencyDismissed(true);
    navigate(`/patients/${id}`);
  };

  return (
    <div className="dashboard flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="dashboard" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">실시간 대시보드</h1>
              <p className="text-sm text-[#5A6B80]">비접촉 환자 모니터링 · 서울중앙병원 3층 병동</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${realtime ? "bg-[#2FA35C]" : "bg-[#E8A13B]"}`}
                aria-hidden="true"
              />
              <p className="text-xs font-bold tracking-wide text-[#5A6B80]">
                {realtime ? "실시간 연결됨" : "재연결 중"} · {formatClock(now)}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[#FDEDEA] px-3 py-2 text-xs font-semibold text-[#E0442E]">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {kpis.map((kpi) => {
              const isActive = activeFilter === kpi.key;
              return (
                <button
                  key={kpi.key}
                  type="button"
                  onClick={() => setActiveFilter(kpi.key)}
                  aria-pressed={isActive}
                  className={`flex overflow-hidden rounded-xl border text-left shadow-[0_2px_3px_rgba(30,42,58,0.08)] transition-shadow ${
                    isActive ? "border-[#2B6FE3] ring-2 ring-[#2B6FE3]" : "border-[#DCE3EC]"
                  }`}
                  style={{ backgroundColor: kpi.bg }}
                >
                  <span className="w-1 shrink-0" style={{ backgroundColor: kpi.color }} />
                  <div className="flex flex-col gap-2 p-6">
                    <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{kpi.label}</p>
                    <p className="text-[32px] font-extrabold" style={{ color: kpi.color }}>
                      {kpi.value}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#5A6B80]">↓ 응급도순 정렬 · 응급 → 경고 → 주의 → 정상</p>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="flex items-center gap-1 text-xs font-bold text-[#2B6FE3]"
              >
                <Icon name="x" size={12} />
                {kpis.find((kpi) => kpi.key === activeFilter)?.label} 필터 해제
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              {visiblePatients.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visiblePatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      {...patient}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE3EC] bg-white p-10 text-center shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <p className="text-sm font-semibold text-[#5A6B80]">해당 상태의 환자가 없습니다.</p>
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[340px] xl:shrink-0">
              <ListPanel title="최근 알림" count={alerts.length} items={alerts} />
              <ListPanel title="응급 이벤트" items={emergencyEvents} />
            </div>
          </div>
        </div>
      </div>

      <EmergencyScreeningOverlay
        patient={screeningPatient}
        onAcknowledge={handleAcknowledge}
        onRespond={handleRespond}
      />
    </div>
  );
}

export default Dashboard;
