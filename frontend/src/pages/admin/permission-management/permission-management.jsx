import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import InviteUserModal from "../../../components/modals/invite-user-modal/invite-user-modal.jsx";
import { apiClient } from "../../../api/client.js";

const ROLE_LABEL = { ADMIN: "시스템관리자", DEPARTMENT: "의료진", GUARDIAN: "보호자" };
const ROLES = Object.keys(ROLE_LABEL);
const STATUS_TABS = ["전체", "활성", "비활성"];
const PAGE_SIZE = 5;

function formatDate(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("ko-KR", { hour12: false });
}

function RoleBadge({ role }) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      className="w-fit rounded-full px-[10px] py-1 text-xs font-bold"
      style={{ backgroundColor: isAdmin ? "#2B6FE31A" : "#EDF1F6", color: isAdmin ? "#2B6FE3" : "#1E2A3A" }}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function AdminPermissionManagement() {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("전체");
  const [roleFilters, setRoleFilters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState([]);

  const loadUsers = () => {
    apiClient
      .get("/admin/users")
      .then(({ data }) => {
        setUsers(data);
        setLoadError("");
      })
      .catch((error) => {
        setLoadError(error?.response?.data?.detail || "권한이 없거나 계정 목록을 불러오지 못했습니다");
      });
  };

  useEffect(() => {
    loadUsers();
    apiClient
      .get("/admin/hospitals")
      .then(({ data }) => setHospitalOptions(data.map((h) => ({ hospital_id: h.hospital_id, name: h.name }))))
      .catch(() => {});
  }, []);

  const handleInviteUser = (form) =>
    apiClient
      .post(`/admin/hospitals/${form.hospital_id}/admins`, {
        login_id: form.login_id,
        password: form.password,
        name: form.name,
        email: form.email,
        phone: form.phone,
      })
      .then(() => loadUsers());

  const toggleRoleFilter = (role) => {
    setRoleFilters((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
    setPage(1);
  };

  const handleToggleActive = (user) =>
    apiClient.patch(`/admin/users/${user.user_id}/status`, { is_active: !user.is_active }).then(loadUsers);

  const hospitalNames = useMemo(
    () => Array.from(new Set(users.map((user) => user.hospital_name).filter(Boolean))),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        query === "" ||
        user.name.toLowerCase().includes(query) ||
        (user.email ?? "").toLowerCase().includes(query);
      const matchesHospital = hospitalFilter === "전체" || user.hospital_name === hospitalFilter;
      const matchesRole = roleFilters.length === 0 || roleFilters.includes(user.role);
      const matchesStatus =
        statusFilter === "전체" || (statusFilter === "활성" ? user.is_active : !user.is_active);
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
        <AdminHeader />

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
              병원 관리자 계정 발급
            </button>
          </div>

          {loadError && <p className="text-sm font-semibold text-[#E0442E]">{loadError}</p>}

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
                  {hospitalNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
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
                    {ROLE_LABEL[role]}
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
                    {["이름", "이메일", "역할", "소속 병원", "가입일", "상태", "관리"].map((heading) => (
                      <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((user) => (
                    <tr key={user.user_id} className="h-14 border-t border-[#DCE3EC]">
                      <td className="px-4 text-sm text-[#1E2A3A]">{user.name}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{user.email ?? "-"}</td>
                      <td className="px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 text-sm text-[#1E2A3A]">{user.hospital_name ?? "-"}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{formatDate(user.created_at)}</td>
                      <td className="px-4">
                        <span className="flex w-fit items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: user.is_active ? "#2FA35C" : "#8B9AAE" }}
                          />
                          <span className={`text-xs font-bold ${user.is_active ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                            {user.is_active ? "활성" : "비활성"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4">
                        {!user.is_super_admin && (
                          <button
                            type="button"
                            aria-label={`${user.name} ${user.is_active ? "비활성화" : "활성화"}`}
                            onClick={() => handleToggleActive(user)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              user.is_active ? "text-[#E0442E] hover:bg-[#FDEDEA]" : "text-[#2FA35C] hover:bg-[#EAF7EF]"
                            }`}
                          >
                            <Icon name="power-off" size={16} />
                          </button>
                        )}
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

      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInviteUser}
        hospitalOptions={hospitalOptions}
      />
    </div>
  );
}

export default AdminPermissionManagement;
