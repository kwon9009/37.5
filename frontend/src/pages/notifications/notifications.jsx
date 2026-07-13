import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";

const FILTERS = [
  { key: "all", label: "전체", count: 18, dot: null },
  { key: "emergency", label: "응급", count: 1, dot: "#E0442E" },
  { key: "warning", label: "경고", count: 2, dot: "#E8762B" },
  { key: "caution", label: "주의", count: 2, dot: "#E8A13B" },
  { key: "system", label: "시스템", count: 3, dot: "#9AA7B6" },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, section: "오늘", patient: "박정호 · 201호", desc: "무호흡 의심 — 즉시 확인 필요", time: "2분 전", severity: "emergency", icon: "triangle-alert", iconBg: "#FDEDEA", iconColor: "#E0442E", unread: true, patientKey: "박정호" },
  { id: 2, section: "오늘", patient: "이영희 · 302호", desc: "심박 118bpm — 경고 임계 초과", time: "14분 전", severity: "warning", icon: "circle-alert", iconBg: "#FBEBDD", iconColor: "#E8762B", unread: true, patientKey: "이영희" },
  { id: 3, section: "오늘", patient: "최수민 · 305호", desc: "호흡 24회/분 — 주의 관찰 필요", time: "32분 전", severity: "caution", icon: "info", iconBg: "#FAF1DE", iconColor: "#E8A13B", unread: false, patientKey: "최수민" },
  { id: 4, section: "오늘", patient: "210호 센서", desc: "센서 연결 끊김 — 장치 확인 필요", time: "1시간 전", severity: "system", icon: "wifi-off", iconBg: "#EDF1F6", iconColor: "#7A8A9E", unread: false, patientKey: null },
  { id: 5, section: "어제", patient: "한지우 · 301호", desc: "심박 122bpm — 경고 임계 초과", time: "어제 21:40", severity: "warning", icon: "circle-alert", iconBg: "#FBEBDD", iconColor: "#E8762B", unread: false, patientKey: "한지우" },
  { id: 6, section: "어제", patient: "김도현 · 208호", desc: "심박 108bpm — 주의 임계 도달", time: "어제 18:12", severity: "caution", icon: "info", iconBg: "#FAF1DE", iconColor: "#E8A13B", unread: false, patientKey: "김도현" },
  { id: 7, section: "어제", patient: "305호 센서", desc: "장치 배터리 20% 이하 — 교체 권장", time: "어제 09:05", severity: "system", icon: "wifi-off", iconBg: "#EDF1F6", iconColor: "#7A8A9E", unread: false, patientKey: null },
];

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(
    () => (activeFilter === "all" ? notifications : notifications.filter((item) => item.severity === activeFilter)),
    [notifications, activeFilter]
  );

  const sections = useMemo(() => {
    const order = ["오늘", "어제"];
    return order.map((section) => ({ section, items: filtered.filter((item) => item.section === section) })).filter((group) => group.items.length > 0);
  }, [filtered]);

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  return (
    <div className="notifications flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="notifications" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={4} />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">알림</h1>
              <p className="text-sm text-[#5A6B80]">실시간 생체신호 경보 및 시스템 알림 내역</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 text-xs font-bold tracking-wide text-[#2B6FE3]"
            >
              <Icon name="check-check" size={16} className="text-[#2B6FE3]" />
              모두 읽음 처리
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-[7px] rounded-full border px-[14px] py-2 text-[13px] font-bold ${
                    isActive ? "border-[#2B6FE3] bg-[#2B6FE3] text-white" : "border-[#DCE3EC] bg-white text-[#1E2A3A]"
                  }`}
                >
                  {filter.dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: filter.dot }} />}
                  {filter.label}
                  <span className={isActive ? "text-white" : "text-[#5A6B80]"}>{filter.count}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            {sections.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-[#5A6B80]">해당 조건의 알림이 없습니다.</p>
            )}
            {sections.map((group) => (
              <div key={group.section}>
                <div className="border-b border-[#DCE3EC] bg-[#EDF1F6] px-5 py-[10px]">
                  <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{group.section}</p>
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-[14px] border-b border-[#DCE3EC] px-5 py-4 last:border-b-0"
                    style={{ backgroundColor: item.unread ? "#F7FAFF" : "#FFFFFF" }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      <Icon name={item.icon} size={20} style={{ color: item.iconColor }} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <div className="flex items-center gap-[7px]">
                        {item.unread && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#2B6FE3]" />}
                        <p className="truncate text-[15px] font-bold text-[#1E2A3A]">{item.patient}</p>
                      </div>
                      <p className="truncate text-sm text-[#5A6B80]">{item.desc}</p>
                      <p className="text-xs text-[#93A0B0]">{item.time}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge severity={item.severity} />
                      <button
                        type="button"
                        aria-label="자세히 보기"
                        disabled={!item.patientKey}
                        onClick={() => item.patientKey && navigate(`/patients/${encodeURIComponent(item.patientKey)}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B6FE3] disabled:opacity-40"
                      >
                        <Icon name="chevron-right" size={18} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
