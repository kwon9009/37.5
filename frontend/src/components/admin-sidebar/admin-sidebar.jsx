import { Link } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import logo from "../icon/37.5.png";

const NAV_ITEMS = [
  { key: "hospitals", to: "/admin/hospitals", icon: "building-2", label: "병원 관리" },
  { key: "devices", to: "/admin/devices", icon: "cpu", label: "장치 관리" },
  { key: "notifications", to: "/admin/notifications", icon: "bell-ring", label: "알림 관리" },
  { key: "permissions", to: "/admin/permissions", icon: "key-round", label: "권한 관리" },
];

function AdminSidebar({ active = "hospitals" }) {
  return (
    <aside className="admin-sidebar flex min-h-screen w-[240px] shrink-0 flex-col bg-[#15111F]">
      <div className="admin-sidebar__logo flex flex-col gap-[10px] px-5 py-6">
        <div className="flex items-center gap-[10px]">
          <img src={logo} alt="37.5" className="h-7 w-7 object-contain" />
          <span className="text-base font-extrabold text-white">37.5℃</span>
        </div>
        <span className="w-fit rounded px-[7px] py-[3px] font-mono text-[10px] font-extrabold tracking-wide text-[#7C5CFC]" style={{ backgroundColor: "#7C5CFC33" }}>
          ADMIN CONSOLE
        </span>
      </div>

      <nav className="admin-sidebar__nav flex flex-col gap-[2px] py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`admin-sidebar__nav-item flex h-12 items-center border-l-4 ${
                isActive ? "border-[#7C5CFC]" : "border-transparent"
              }`}
            >
              <span className="flex h-full w-full items-center gap-3 px-4">
                <Icon name={item.icon} size={20} className={isActive ? "text-white" : "text-[#8B8FA3]"} />
                <span className={`text-sm font-bold ${isActive ? "text-white" : "text-[#8B8FA3]"}`}>
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__spacer flex-1" />

      <Link
        to="/dashboard"
        className="admin-sidebar__exit flex items-center gap-[10px] border-t border-white/10 px-5 py-4 text-[#8B8FA3] hover:text-white"
      >
        <Icon name="arrow-left" size={16} />
        <span className="text-[13px] font-semibold">메인 앱으로 돌아가기</span>
      </Link>
    </aside>
  );
}

export default AdminSidebar;
