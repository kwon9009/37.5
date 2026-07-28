import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import { HOSPITALS, DEVICES, USERS } from "../../data/admin.js";

const RESULT_GROUPS = [
  {
    key: "hospitals",
    label: "병원",
    icon: "building-2",
    items: HOSPITALS,
    match: (item, query) => item.name.includes(query) || item.region.includes(query),
    describe: (item) => item.region,
    path: (item) => `/admin/hospitals/${encodeURIComponent(item.id)}`,
  },
  {
    key: "devices",
    label: "장치",
    icon: "cpu",
    items: DEVICES,
    match: (item, query) => item.id.toLowerCase().includes(query.toLowerCase()) || item.room.includes(query),
    describe: (item) => item.room,
    path: (item) => `/admin/devices/${encodeURIComponent(item.id)}`,
  },
  {
    key: "users",
    label: "사용자",
    icon: "user-check",
    items: USERS,
    match: (item, query) => item.name.includes(query) || item.email.toLowerCase().includes(query.toLowerCase()),
    describe: (item) => item.hospital,
    path: () => "/admin/permissions",
  },
];

function AdminHeader({ notificationCount = 5 }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const trimmedQuery = searchQuery.trim();
  const resultGroups = trimmedQuery
    ? RESULT_GROUPS.map((group) => ({
        ...group,
        matches: group.items.filter((item) => group.match(item, trimmedQuery)).slice(0, 4),
      })).filter((group) => group.matches.length > 0)
    : [];

  const handleSelect = (group, item) => {
    navigate(group.path(item));
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <header className="admin-header flex h-16 items-center justify-between bg-[#15111F] px-6">
      <div className="admin-header__left flex items-center gap-2">
        <span className="text-sm font-semibold text-[#8B8FA3]">
          병원 <span className="font-mono font-bold text-white">{HOSPITALS.length}</span>곳 · 사용자{" "}
          <span className="font-mono font-bold text-white">{USERS.length}</span>명 관리 중
        </span>
      </div>

      <div className="admin-header__search relative">
        <div className="flex h-[38px] w-[360px] items-center gap-2 rounded-lg bg-[#241F30] px-[14px]">
          <Icon name="search" size={16} className="shrink-0 text-[#8B8FA3]" />
          <input
            type="text"
            placeholder="병원, 장치, 사용자 검색"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 120)}
            className="w-full border-0 bg-transparent text-sm text-white placeholder:text-[#8B8FA3] focus:outline-none"
          />
        </div>

        {isSearchOpen && trimmedQuery && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(30,42,58,0.25)]">
            {resultGroups.length > 0 ? (
              resultGroups.map((group) => (
                <div key={group.key}>
                  <p className="bg-[#EDF1F6] px-4 py-[6px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
                    {group.label}
                  </p>
                  {group.matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => handleSelect(group, item)}
                      className="flex w-full items-center gap-3 border-b border-[#DCE3EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F7FA]"
                    >
                      <Icon name={group.icon} size={16} className="shrink-0 text-[#7C5CFC]" />
                      <div className="flex min-w-0 flex-col gap-[2px]">
                        <span className="truncate text-sm font-semibold text-[#1E2A3A]">{item.name ?? item.id}</span>
                        <span className="truncate text-xs text-[#5A6B80]">{group.describe(item)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-[#5A6B80]">"{trimmedQuery}"에 해당하는 결과가 없습니다</p>
            )}
          </div>
        )}
      </div>

      <div className="admin-header__right flex items-center gap-[18px]">
        <button
          type="button"
          aria-label="알림"
          onClick={() => navigate("/admin/notifications")}
          className="relative flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15111F]"
        >
          <Icon name="bell" size={22} className="text-white" />
          {notificationCount > 0 && (
            <span className="absolute -right-2 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E0442E] text-[11px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin-login")}
          className="admin-header__user flex items-center gap-2"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#7C5CFC]">
            <Icon name="shield" size={16} className="text-white" />
          </span>
          <span className="text-sm font-semibold text-white">시스템관리자</span>
          <Icon name="chevron-down" size={16} className="text-[#8B8FA3]" />
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
