import { Link } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import logo from "../icon/37.5.png";
import { useUnreadAlertCount } from "../../hooks/use-unread-alert-count.js";
import { usePendingLinkRequestCount } from "../../hooks/use-pending-link-request-count.js";
import { useAuthStore } from "../../store/auth-store.js";

function Sidebar({ active = "dashboard" }) {
  const unreadCount = useUnreadAlertCount();
  const pendingLinkRequestCount = usePendingLinkRequestCount();
  const role = useAuthStore((state) => state.role);

  const NAV_ITEMS = [
    { key: "dashboard", to: "/dashboard", icon: "layout-dashboard", label: "대시보드" },
    { key: "patients", to: "/patients", icon: "users", label: "환자 목록" },
    { key: "monitoring", to: "/monitoring", icon: "activity", label: "실시간 모니터링" },
    { key: "notifications", to: "/notifications", icon: "bell", label: "알림", badge: unreadCount > 0 ? unreadCount : null },
    {
      key: "integration",
      to: "/integration-requests",
      icon: "user-check",
      label: "연동 요청",
      badge: pendingLinkRequestCount > 0 ? pendingLinkRequestCount : null,
    },
  ];

  return (
    <aside className="sidebar flex min-h-screen w-[240px] shrink-0 flex-col bg-[#1E2A3A]">
      <div className="sidebar__logo flex items-center gap-[10px] px-5 py-6">
        <img src={logo} alt="37.5" className="h-7 w-7 object-contain" />
        <span className="text-base font-extrabold text-white">37.5℃</span>
      </div>

      <nav className="sidebar__nav flex flex-col gap-[2px] py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`sidebar__nav-item flex h-12 items-center border-l-4 ${
                isActive ? "border-[#2B6FE3]" : "border-transparent"
              }`}
            >
              <span className="flex h-full w-full items-center justify-between gap-3 px-4">
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} size={20} className={isActive ? "text-white" : "text-[#8B9AAE]"} />
                  <span className={`text-sm font-bold ${isActive ? "text-white" : "text-[#8B9AAE]"}`}>
                    {item.label}
                  </span>
                </span>
                {item.badge != null && (
                  <span className="flex items-center justify-center rounded-full bg-[#E0442E] px-[7px] py-[2px] text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__spacer flex-1" />

      {role === "ADMIN" && (
        <Link
          to="/admin-login"
          className="sidebar__dev-hint flex items-center gap-2 border-t border-white/10 px-5 py-4 text-[#5A6B7F] hover:text-[#8B9AAE]"
        >
          <Icon name="terminal" size={13} />
          <span className="font-mono text-[11px] font-medium">/dev 경로로 관리자 모드 진입</span>
        </Link>
      )}
    </aside>
  );
}

export default Sidebar;
