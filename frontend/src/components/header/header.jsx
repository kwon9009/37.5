import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import StatusBadge from "../status-badge/status-badge.jsx";
import { PATIENTS } from "../../data/patients.js";
import { useAuthStore } from "../../store/auth-store.js";
import { useUnreadAlertCount } from "../../hooks/use-unread-alert-count.js";
import { useMyHospital } from "../../hooks/use-my-hospital.js";

// 관리자는 특정 병원 소속이 아니라 여러 병원을 관리한다
const ADMIN_LABEL = "37.5 SmartCare";

function Header({ hospitalName, userName, notificationCount }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const loginId = useAuthStore((state) => state.loginId);
  const role = useAuthStore((state) => state.role);
  const displayName = userName ?? loginId ?? "김간호 · RN";

  // 로그인한 계정의 실제 소속 병원. prop으로 직접 준 이름이 있으면 그걸 우선한다
  // (개발용 컴포넌트 목록 화면처럼 서버 없이 보여줘야 하는 곳이 있다).
  const myHospital = useMyHospital();
  const shownHospitalName =
    hospitalName ?? myHospital ?? (role === "ADMIN" ? ADMIN_LABEL : "");
  const liveUnreadCount = useUnreadAlertCount();
  const badgeCount = notificationCount ?? liveUnreadCount;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const trimmedQuery = searchQuery.trim();
  const matches = trimmedQuery
    ? PATIENTS.filter(
        (patient) => patient.name.includes(trimmedQuery) || patient.room.includes(trimmedQuery)
      ).slice(0, 6)
    : [];

  const handleSelectPatient = (patientId) => {
    navigate(`/patients/${encodeURIComponent(patientId)}`);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <header className="header flex h-16 items-center justify-between bg-[#1E2A3A] px-6">
      <div className="header__left flex items-center gap-2">
        <span className="text-base font-bold text-white">{shownHospitalName}</span>
      </div>

      <div className="header__search relative">
        <div className="flex h-[38px] w-[360px] items-center gap-2 rounded-lg bg-[#2A3849] px-[14px]">
          <Icon name="search" size={16} className="shrink-0 text-[#8B9AAE]" />
          <input
            type="text"
            placeholder="환자, 병실 검색"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 120)}
            className="w-full border-0 bg-transparent text-sm text-white placeholder:text-[#8B9AAE] focus:outline-none"
          />
        </div>

        {isSearchOpen && trimmedQuery && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(30,42,58,0.25)]">
            {matches.length > 0 ? (
              matches.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onMouseDown={() => handleSelectPatient(patient.id)}
                  className="flex w-full items-center justify-between gap-3 border-b border-[#DCE3EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F7FA]"
                >
                  <div className="flex min-w-0 flex-col gap-[2px]">
                    <span className="truncate text-sm font-semibold text-[#1E2A3A]">{patient.name}</span>
                    <span className="text-xs text-[#5A6B80]">{patient.room}</span>
                  </div>
                  <StatusBadge severity={patient.severity} />
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-[#5A6B80]">"{trimmedQuery}"에 해당하는 환자가 없습니다</p>
            )}
          </div>
        )}
      </div>

      <div className="header__right flex items-center gap-[18px]">
        <button
          type="button"
          aria-label="알림"
          onClick={() => navigate("/notifications")}
          className="relative flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E2A3A]"
        >
          <Icon name="bell" size={22} className="text-white" />
          {badgeCount > 0 && (
            <span className="absolute -right-2 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E0442E] text-[11px] font-bold text-white">
              {badgeCount}
            </span>
          )}
        </button>

        <div className="header__user-menu relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 120)}
            className="header__user flex items-center gap-2"
          >
            <span className="h-[34px] w-[34px] rounded-full bg-[#2B6FE3]" />
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <Icon name="chevron-down" size={16} className="text-[#8B9AAE]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[180px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(30,42,58,0.25)]">
              <button
                type="button"
                onMouseDown={() => navigate("/personal-settings")}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#1E2A3A] hover:bg-[#F5F7FA]"
              >
                <Icon name="settings" size={16} className="text-[#5A6B80]" />
                개인 설정
              </button>
              <button
                type="button"
                onMouseDown={handleLogout}
                className="flex w-full items-center gap-2 border-t border-[#DCE3EC] px-4 py-3 text-left text-sm text-[#E0442E] hover:bg-[#FDEDEA]"
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

export default Header;
