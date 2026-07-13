import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";

const LEGEND = [
  { label: "응급", color: "#E0442E" },
  { label: "경고", color: "#E8762B" },
  { label: "주의", color: "#E8A13B" },
  { label: "정상", color: "#2FA35C" },
];

const WARDS = [
  { name: "3병동", count: 12 },
  { name: "4병동", count: 9 },
  { name: "5병동", count: 15 },
  { name: "6병동", count: 8 },
  { name: "중환자실", count: 6 },
];

const PATIENTS = [
  { name: "박정호", room: "201호 · B-3", severity: "emergency", heartRate: 128, respirationRate: 26, connected: true, battery: 72 },
  { name: "최수민", room: "305호 · A-1", severity: "warning", heartRate: 119, respirationRate: 23, connected: true, battery: 40 },
  { name: "이영희", room: "302호 · A-2", severity: "caution", heartRate: 104, respirationRate: 18, connected: true, battery: 88 },
  { name: "김도현", room: "208호 · C-3", severity: "caution", heartRate: 99, respirationRate: 17, connected: true, battery: 61 },
  { name: "정미경", room: "210호 · B-2", severity: "offline", connected: false, battery: null },
  { name: "한지우", room: "301호 · A-3", severity: "normal", heartRate: 76, respirationRate: 15, connected: true, battery: 95 },
  { name: "오세훈", room: "303호 · A-1", severity: "normal", heartRate: 72, respirationRate: 14, connected: true, battery: 80 },
  { name: "윤서연", room: "206호 · C-1", severity: "normal", heartRate: 68, respirationRate: 13, connected: true, battery: 52 },
  { name: "강민준", room: "209호 · B-4", severity: "normal", heartRate: 74, respirationRate: 16, connected: true, battery: 100 },
  { name: "조은지", room: "305호 · A-4", severity: "normal", heartRate: 80, respirationRate: 15, connected: true, battery: 47 },
  { name: "임재현", room: "204호 · C-2", severity: "normal", heartRate: 70, respirationRate: 14, connected: true, battery: 66 },
  { name: "서예린", room: "207호 · B-3", severity: "normal", heartRate: 78, respirationRate: 16, connected: true, battery: 33 },
];

const CARD_STYLE = {
  emergency: { background: "#FDEDEA", borderColor: "#E0442E", borderWidth: 2 },
  offline: { background: "#EDF1F6", borderColor: "#DCE3EC", borderWidth: 1 },
};

function formatWardClock(date) {
  const datePart = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
  const timePart = date.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function MonitorCard({ patient }) {
  const navigate = useNavigate();
  const style = CARD_STYLE[patient.severity] ?? { background: "#FFFFFF", borderColor: "#DCE3EC", borderWidth: 1 };
  const valueColor = patient.severity === "emergency" ? "#E0442E" : "#1E2A3A";
  const batteryColor = patient.battery != null && patient.battery <= 40 ? "#E8A13B" : "#5A6B80";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${patient.name} 상세 보기`}
      onClick={() => navigate(`/patients/${encodeURIComponent(patient.name)}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/patients/${encodeURIComponent(patient.name)}`);
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
          <span className="text-[11px] text-[#5A6B80]">{patient.connected ? "연결됨" : "연결 끊김"}</span>
        </div>
        <div className="flex items-center gap-[5px]">
          <Icon name={patient.battery == null ? "battery-warning" : "battery"} size={14} style={{ color: batteryColor }} />
          <span className="text-[11px] text-[#5A6B80]">{patient.battery != null ? `${patient.battery}%` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

function RealtimeMonitoring() {
  const [activeWard, setActiveWard] = useState("3병동");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="realtime-monitoring flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="monitoring" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={3} />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">실시간 모니터링 · 3병동</h1>
              <p className="text-[13px] text-[#5A6B80]">위험 환자 우선 정렬 · 자동 갱신</p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
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

          <div className="flex flex-wrap items-center gap-[10px]">
            {WARDS.map((ward) => {
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PATIENTS.map((patient) => (
              <MonitorCard key={patient.name} patient={patient} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeMonitoring;
