import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../icon/icon.jsx";
import StatusBadge from "../status-badge/status-badge.jsx";
import { PATIENTS } from "../../data/patients.js";

function Header({ hospitalName = "서울중앙병원", userName = "김간호 · RN", notificationCount = 3 }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

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
        <span className="text-base font-bold text-white">{hospitalName}</span>
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
          {notificationCount > 0 && (
            <span className="absolute -right-2 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E0442E] text-[11px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <button type="button" onClick={() => navigate("/personal-settings")} className="header__user flex items-center gap-2">
          <span className="h-[34px] w-[34px] rounded-full bg-[#2B6FE3]" />
          <span className="text-sm font-semibold text-white">{userName}</span>
          <Icon name="chevron-down" size={16} className="text-[#8B9AAE]" />
        </button>
      </div>
    </header>
  );
}

export default Header;
