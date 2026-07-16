import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import PatientCard from "../../components/patient-card/patient-card.jsx";
import Icon from "../../components/icon/icon.jsx";
import EmergencyScreeningOverlay from "../../components/emergency-screening-overlay/emergency-screening-overlay.jsx";

const KPIS = [
  { key: "all", label: "전체 환자", value: 42, color: "#1E2A3A", bg: "#FFFFFF" },
  { key: "normal", label: "정상", value: 28, color: "#2FA35C", bg: "#FFFFFF" },
  { key: "caution", label: "주의", value: 8, color: "#E8A13B", bg: "#FFFFFF" },
  { key: "warning", label: "경고", value: 4, color: "#E8762B", bg: "#FFFFFF" },
  { key: "emergency", label: "응급", value: 2, color: "#E0442E", bg: "#FDEDEA" },
];

const ALL_PATIENTS = [
  { name: "정수빈", room: "305호 · B-3", severity: "emergency", heartRate: 118, respirationRate: 23, sensorStatus: "신호 이상", timestamp: "14:24:11" },
  { name: "박민준", room: "302호 · A-4", severity: "warning", heartRate: 104, respirationRate: 21, sensorStatus: "연결됨", timestamp: "14:31:52" },
  { name: "최지우", room: "308호 · C-2", severity: "caution", heartRate: 88, respirationRate: 18, sensorStatus: "신호 약함", timestamp: "14:28:33" },
  { name: "이영희", room: "302호 · A-2", severity: "normal", heartRate: 78, respirationRate: 16, sensorStatus: "연결됨", timestamp: "14:32:08" },
  { name: "김철수", room: "305호 · B-1", severity: "normal", heartRate: 72, respirationRate: 15, sensorStatus: "연결됨", timestamp: "14:32:05" },
  { name: "한서연", room: "308호 · C-4", severity: "normal", heartRate: 69, respirationRate: 14, sensorStatus: "연결됨", timestamp: "14:31:47" },
];

const RECENT_ALERTS = [
  { name: "박민준 · 302호", detail: "심박 104bpm 상승 · 14:31", color: "#E8762B", path: "/patients/박민준" },
  { name: "최지우 · 308호", detail: "호흡 불규칙 감지 · 14:28", color: "#E8A13B", path: "/patients/최지우" },
  { name: "정수빈 · 305호", detail: "무호흡 알림 · 14:24", color: "#E0442E", path: "/patients/정수빈" },
];

const EMERGENCY_EVENTS = [
  { name: "정수빈 · 305호", detail: "응급 호출 발생 · 14:24", color: "#E0442E", path: "/patients/정수빈" },
];

function formatClock(date) {
  return date.toLocaleTimeString("ko-KR", { hour12: false });
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
  const [acknowledgedNames, setAcknowledgedNames] = useState(() => new Set());
  const [screeningEnabled, setScreeningEnabled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 실시간 감지 이벤트를 흉내내기 위한 지연 (실제로는 SSE로 응급 이벤트 수신 시 즉시 트리거)
    const timeout = setTimeout(() => setScreeningEnabled(true), 1200);
    return () => clearTimeout(timeout);
  }, []);

  const visiblePatients =
    activeFilter === "all" ? ALL_PATIENTS : ALL_PATIENTS.filter((patient) => patient.severity === activeFilter);

  const screeningPatient = screeningEnabled
    ? ALL_PATIENTS.find((patient) => patient.severity === "emergency" && !acknowledgedNames.has(patient.name))
    : undefined;

  const handleAcknowledge = () => {
    setAcknowledgedNames((current) => new Set(current).add(screeningPatient.name));
  };

  const handleRespond = () => {
    const name = screeningPatient.name;
    setAcknowledgedNames((current) => new Set(current).add(name));
    navigate(`/patients/${encodeURIComponent(name)}`);
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
            <p className="text-xs font-bold tracking-wide text-[#5A6B80]">마지막 업데이트 {formatClock(now)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {KPIS.map((kpi) => {
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
                {KPIS.find((kpi) => kpi.key === activeFilter)?.label} 필터 해제
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              {visiblePatients.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visiblePatients.map((patient) => (
                    <PatientCard
                      key={patient.name}
                      {...patient}
                      onClick={() => navigate(`/patients/${encodeURIComponent(patient.name)}`)}
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
              <ListPanel title="최근 알림" count={RECENT_ALERTS.length} items={RECENT_ALERTS} />
              <ListPanel title="응급 이벤트" items={EMERGENCY_EVENTS} />
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
