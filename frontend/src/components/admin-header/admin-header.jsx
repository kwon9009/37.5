import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import { apiClient } from "../../api/client.js";
import { useAuthStore } from "../../store/auth-store.js";

function AdminHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const loginId = useAuthStore((state) => state.loginId);

  useEffect(() => {
    apiClient
      .get("/admin/hospitals")
      .then(({ data }) => setHospitals(data))
      .catch(() => {});
    apiClient
      .get("/admin/devices", { params: { page_size: 200 } })
      .then(({ data }) => setDevices(data.items))
      .catch(() => {});
    // 슈퍼관리자가 아니면 403 - 검색 대상에서 조용히 빠진다
    apiClient
      .get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch(() => {});
    apiClient
      .get("/hospital-requests")
      .then(({ data }) => setPendingRequests(data.filter((request) => request.status === "PENDING")))
      .catch(() => {});
  }, []);

  const resultGroups = [
    {
      key: "hospitals",
      label: "병원",
      icon: "building-2",
      items: hospitals,
      getId: (item) => item.hospital_id,
      match: (item, query) => item.name.includes(query) || item.region.includes(query),
      describe: (item) => item.region,
      path: (item) => `/admin/hospitals/${item.hospital_id}`,
    },
    {
      key: "devices",
      label: "장치",
      icon: "cpu",
      items: devices,
      getId: (item) => item.device_id,
      match: (item, query) =>
        item.serial_num.toLowerCase().includes(query.toLowerCase()) ||
        item.hospital_name.includes(query) ||
        (item.ward ?? "").includes(query),
      describe: (item) => (item.room_num != null ? `${item.hospital_name} · ${item.ward} ${item.room_num}호` : item.hospital_name),
      path: (item) => `/admin/devices/${item.device_id}`,
      name: (item) => item.serial_num,
    },
    {
      key: "users",
      label: "사용자",
      icon: "user-check",
      items: users,
      getId: (item) => item.user_id,
      match: (item, query) => item.name.includes(query) || (item.email ?? "").toLowerCase().includes(query.toLowerCase()),
      describe: (item) => item.hospital_name ?? "-",
      path: () => "/admin/permissions",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  const trimmedQuery = searchQuery.trim();
  const matchedGroups = trimmedQuery
    ? resultGroups
        .map((group) => ({
          ...group,
          matches: group.items.filter((item) => group.match(item, trimmedQuery)).slice(0, 4),
        }))
        .filter((group) => group.matches.length > 0)
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
          병원 <span className="font-mono font-bold text-white">{hospitals.length}</span>곳 · 사용자{" "}
          <span className="font-mono font-bold text-white">{users.length}</span>명 관리 중
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
            {matchedGroups.length > 0 ? (
              matchedGroups.map((group) => (
                <div key={group.key}>
                  <p className="bg-[#EDF1F6] px-4 py-[6px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
                    {group.label}
                  </p>
                  {group.matches.map((item) => (
                    <button
                      key={group.getId(item)}
                      type="button"
                      onMouseDown={() => handleSelect(group, item)}
                      className="flex w-full items-center gap-3 border-b border-[#DCE3EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F7FA]"
                    >
                      <Icon name={group.icon} size={16} className="shrink-0 text-[#7C5CFC]" />
                      <div className="flex min-w-0 flex-col gap-[2px]">
                        <span className="truncate text-sm font-semibold text-[#1E2A3A]">
                          {group.name ? group.name(item) : item.name}
                        </span>
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
        <div className="admin-header__notifications relative">
          <button
            type="button"
            aria-label="알림"
            onClick={() => setIsNotificationOpen((current) => !current)}
            onBlur={() => setTimeout(() => setIsNotificationOpen(false), 120)}
            className="relative flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15111F]"
          >
            <Icon name="bell" size={22} className="text-white" />
            {pendingRequests.length > 0 && (
              <span className="absolute -right-2 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E0442E] text-[11px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(30,42,58,0.25)]">
              <p className="bg-[#EDF1F6] px-4 py-[6px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
                병원 등록 요청 대기중 {pendingRequests.length}건
              </p>
              {pendingRequests.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#5A6B80]">확인할 알림이 없습니다</p>
              ) : (
                pendingRequests.slice(0, 5).map((request) => (
                  <button
                    key={request.hospital_request_id}
                    type="button"
                    onMouseDown={() => {
                      navigate("/admin/hospitals");
                      setIsNotificationOpen(false);
                    }}
                    className="flex w-full flex-col gap-[2px] border-b border-[#DCE3EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F7FA]"
                  >
                    <span className="truncate text-sm font-semibold text-[#1E2A3A]">
                      {request.hospital_name}{" "}
                      <span className="font-normal text-[#5A6B80]">
                        · {request.area} · {request.bed_count}병상
                      </span>
                    </span>
                    <span className="text-xs text-[#5A6B80]">
                      {new Date(request.requested_at).toLocaleString("ko-KR", { hour12: false })} 요청
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="admin-header__user-menu relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 120)}
            className="admin-header__user flex items-center gap-2"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#7C5CFC]">
              <Icon name="shield" size={16} className="text-white" />
            </span>
            <span className="text-sm font-semibold text-white">{loginId ?? "시스템관리자"}</span>
            <Icon name="chevron-down" size={16} className="text-[#8B8FA3]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[180px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(30,42,58,0.25)]">
              <button
                type="button"
                onMouseDown={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#E0442E] hover:bg-[#FDEDEA]"
              >
                <Icon name="log-out" size={16} className="text-[#E0442E]" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
