import { useMemo, useState } from "react";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import InviteUserModal from "../../../components/modals/invite-user-modal/invite-user-modal.jsx";
import { USERS as INITIAL_USERS, HOSPITALS } from "../../../data/admin.js";

const ROLES = ["시스템관리자", "의료진", "보호자"];
const STATUS_TABS = ["전체", "활성", "비활성"];
const PAGE_SIZE = 5;

function RoleBadge({ role }) {
  const isAdmin = role === "시스템관리자";
  return (
    <span
      className="w-fit rounded-full px-[10px] py-1 text-xs font-bold"
      style={{ backgroundColor: isAdmin ? "#2B6FE31A" : "#EDF1F6", color: isAdmin ? "#2B6FE3" : "#1E2A3A" }}
    >
      {role}
    </span>
  );
}

function AdminPermissionManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("전체");
  const [roleFilters, setRoleFilters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInviteUser = (form) => {
    setUsers((current) => [
      { id: `${form.name}-${Date.now()}`, name: form.name, email: form.email, role: form.role, hospital: form.hospital, lastLogin: "-", active: true },
      ...current,
    ]);
  };

  const toggleRoleFilter = (role) => {
    setRoleFilters((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
    setPage(1);
  };

  const handleToggleActive = (id) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, active: !user.active } : user)));
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        query === "" || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchesHospital = hospitalFilter === "전체" || user.hospital === hospitalFilter;
      const matchesRole = roleFilters.length === 0 || roleFilters.includes(user.role);
      const matchesStatus =
        statusFilter === "전체" || (statusFilter === "활성" ? user.active : !user.active);
      return matchesQuery && matchesHospital && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, hospitalFilter, roleFilters, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-permission-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="permissions" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">권한 관리</h1>
              <p className="text-sm text-[#5A6B80]">병원 사용자 계정과 접근 권한 관리</p>
            </div>
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white"
            >
              <Icon name="plus" size={16} className="text-white" />
              사용자 초대
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-full max-w-[280px] items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="search" size={16} className="shrink-0 text-[#5A6B80]" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일 검색"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  className="w-full border-0 bg-transparent text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>

              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="building-2" size={15} className="shrink-0 text-[#5A6B80]" />
                <select
                  value={hospitalFilter}
                  onChange={(event) => {
                    setHospitalFilter(event.target.value);
                    setPage(1);
                  }}
                  className="appearance-none bg-transparent text-sm text-[#1E2A3A] focus:outline-none"
                >
                  <option value="전체">전체 병원</option>
                  {HOSPITALS.map((hospital) => (
                    <option key={hospital.id} value={hospital.name}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-[2px] rounded-lg border border-[#DCE3EC] bg-white p-[2px]">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-[6px] text-xs font-semibold ${
                      statusFilter === tab ? "bg-[#2B6FE3] text-white" : "text-[#5A6B80]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-[#5A6B80]">역할</span>
              {ROLES.map((role) => {
                const isActive = roleFilters.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRoleFilter(role)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      isActive ? "border-[#2B6FE3] bg-[#2B6FE3] text-white" : "border-[#DCE3EC] bg-white text-[#1E2A3A]"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1E2A3A]">사용자 목록</h2>
            <p className="text-[13px] text-[#5A6B80]">
              총 {users.length}명 중 {filteredUsers.length}명 표시
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[945px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead>
                  <tr className="h-12 bg-[#EDF1F6]">
                    {["이름", "이메일", "역할", "소속 병원", "마지막 로그인", "상태", "관리"].map((heading) => (
                      <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((user) => (
                    <tr key={user.id} className="h-14 border-t border-[#DCE3EC]">
                      <td className="px-4 text-sm text-[#1E2A3A]">{user.name}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{user.email}</td>
                      <td className="px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 text-sm text-[#1E2A3A]">{user.hospital}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{user.lastLogin}</td>
                      <td className="px-4">
                        <span className="flex w-fit items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: user.active ? "#2FA35C" : "#8B9AAE" }}
                          />
                          <span className={`text-xs font-bold ${user.active ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                            {user.active ? "활성" : "비활성"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4">
                        <button
                          type="button"
                          aria-label={`${user.name} ${user.active ? "비활성화" : "활성화"}`}
                          onClick={() => handleToggleActive(user.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A6B80] hover:bg-[#EDF1F6]"
                        >
                          <Icon name="ellipsis" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                        조건에 맞는 사용자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#DCE3EC] px-4 py-3">
                <p className="text-xs text-[#5A6B80]">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} / {filteredUsers.length}명
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A6B80] hover:bg-[#EDF1F6] disabled:opacity-30"
                  >
                    <Icon name="chevron-left" size={16} />
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#1E2A3A]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A6B80] hover:bg-[#EDF1F6] disabled:opacity-30"
                  >
                    <Icon name="chevron-right" size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InviteUserModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onSubmit={handleInviteUser} />
    </div>
  );
}

export default AdminPermissionManagement;
