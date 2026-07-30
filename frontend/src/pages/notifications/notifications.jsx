import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import { apiClient } from "../../api/client.js";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "unread", label: "읽지 않음" },
];

function formatRelative(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return date.toLocaleDateString("ko-KR");
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const loadNotifications = () => {
    apiClient
      .get("/dashboard/recent-alerts")
      .then(({ data }) => setNotifications(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filtered = useMemo(
    () => (activeFilter === "unread" ? notifications.filter((item) => !item.is_read) : notifications),
    [notifications, activeFilter],
  );

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markRead = (alertId) => {
    apiClient.patch(`/alerts/${alertId}/read`).then(loadNotifications);
  };

  const handleMarkAllRead = () => {
    Promise.all(
      notifications.filter((item) => !item.is_read).map((item) => apiClient.patch(`/alerts/${item.alert_id}/read`)),
    ).then(loadNotifications);
  };

  return (
    <div className="notifications flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="notifications" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={unreadCount} />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">알림</h1>
              <p className="text-sm text-[#5A6B80]">실시간 생체신호 경보 내역</p>
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
                  {filter.label}
                  <span className={isActive ? "text-white" : "text-[#5A6B80]"}>
                    {filter.key === "unread" ? unreadCount : notifications.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            {filtered.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-[#5A6B80]">해당 조건의 알림이 없습니다.</p>
            )}
            {filtered.map((item) => (
              <div
                key={item.alert_id}
                className="flex items-center gap-[14px] border-b border-[#DCE3EC] px-5 py-4 last:border-b-0"
                style={{ backgroundColor: item.is_read ? "#FFFFFF" : "#F7FAFF" }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDEDEA]">
                  <Icon name="triangle-alert" size={20} style={{ color: "#E0442E" }} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <div className="flex items-center gap-[7px]">
                    {!item.is_read && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#2B6FE3]" />}
                    <p className="truncate text-[15px] font-bold text-[#1E2A3A]">
                      {item.patient_name} · {item.room}
                    </p>
                  </div>
                  <p className="truncate text-sm text-[#5A6B80]">{item.message}</p>
                  <p className="text-xs text-[#93A0B0]">{formatRelative(item.sent_at)}</p>
                </div>
                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => markRead(item.alert_id)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#2B6FE3] px-3 text-xs font-bold text-white"
                  >
                    <Icon name="check" size={14} className="text-white" />
                    읽음
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
