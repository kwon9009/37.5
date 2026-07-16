import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import AddHospitalModal from "../../../components/modals/add-hospital-modal/add-hospital-modal.jsx";
import { HOSPITALS as INITIAL_HOSPITALS } from "../../../data/admin.js";
import { useHospitalRequestStore } from "../../../store/hospital-request-store.js";

const STATUS_TABS = ["전체", "활성", "비활성"];
const PAGE_SIZE = 5;

function AdminHospitalManagement() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const hospitalRequests = useHospitalRequestStore((state) => state.requests);
  const pendingRequests = useMemo(
    () => hospitalRequests.filter((request) => request.status === "대기중"),
    [hospitalRequests]
  );
  const approveRequest = useHospitalRequestStore((state) => state.approveRequest);
  const rejectRequest = useHospitalRequestStore((state) => state.rejectRequest);

  const handleApproveRequest = (request) => {
    approveRequest(request.id);
    setHospitals((current) => [
      {
        id: `${request.hospitalName}-${Date.now()}`,
        name: request.hospitalName,
        region: request.area,
        beds: 0,
        devices: 0,
        manager: "-",
        active: true,
      },
      ...current,
    ]);
  };

  const regionOptions = useMemo(
    () => Array.from(new Set(hospitals.map((hospital) => hospital.region))),
    [hospitals]
  );

  const handleAddHospital = (form) => {
    setHospitals((current) => [
      { id: `${form.name}-${Date.now()}`, name: form.name, region: form.region, beds: form.beds, devices: 0, manager: form.manager || "-", active: true },
      ...current,
    ]);
  };

  const filteredHospitals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return hospitals.filter((hospital) => {
      const matchesQuery = query === "" || hospital.name.toLowerCase().includes(query);
      const matchesRegion = regionFilter === "전체" || hospital.region === regionFilter;
      const matchesStatus =
        statusFilter === "전체" || (statusFilter === "활성" ? hospital.active : !hospital.active);
      return matchesQuery && matchesRegion && matchesStatus;
    });
  }, [hospitals, searchQuery, regionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHospitals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageHospitals = filteredHospitals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-hospital-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="hospitals" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">병원 관리</h1>
              <p className="text-sm text-[#5A6B80]">등록된 병원과 병상·장치 현황 관리</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white"
            >
              <Icon name="plus" size={16} className="text-white" />
              병원 추가
            </button>
          </div>

          {pendingRequests.length > 0 && (
            <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[#E8A13B] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
              <div className="flex items-center justify-between bg-[#FCF0DC] px-5 py-3">
                <p className="text-sm font-bold text-[#1E2A3A]">병원 등록 요청 · 대기중 {pendingRequests.length}건</p>
              </div>
              <div className="flex flex-col px-5 pb-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE3EC] py-3 last:border-b-0"
                  >
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-bold text-[#1E2A3A]">
                        {request.hospitalName} <span className="font-normal text-[#5A6B80]">· {request.area}</span>
                      </p>
                      <p className="text-xs text-[#5A6B80]">{request.address}</p>
                      <p className="text-[11px] text-[#5A6B80]">{request.requestedAt} 요청</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(request)}
                        className="flex items-center gap-1 rounded-lg bg-[#2FA35C] px-3 py-[6px] text-xs font-bold text-white"
                      >
                        <Icon name="check" size={13} className="text-white" />
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectRequest(request.id)}
                        className="flex items-center gap-1 rounded-lg border border-[#DCE3EC] bg-white px-3 py-[6px] text-xs font-semibold text-[#5A6B80]"
                      >
                        <Icon name="x" size={13} />
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-full max-w-[280px] items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="search" size={16} className="shrink-0 text-[#5A6B80]" />
                <input
                  type="text"
                  placeholder="병원명 검색"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  className="w-full border-0 bg-transparent text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>

              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="map-pin" size={15} className="shrink-0 text-[#5A6B80]" />
                <select
                  value={regionFilter}
                  onChange={(event) => {
                    setRegionFilter(event.target.value);
                    setPage(1);
                  }}
                  className="appearance-none bg-transparent text-sm text-[#1E2A3A] focus:outline-none"
                >
                  <option value="전체">전체 지역</option>
                  {regionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1E2A3A]">병원 목록</h2>
            <p className="text-[13px] text-[#5A6B80]">
              총 {hospitals.length}곳 중 {filteredHospitals.length}곳 표시
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="h-12 bg-[#EDF1F6]">
                  {["병원명", "지역", "병상 수", "연결 장치", "담당 관리자", "상태", "관리"].map((heading) => (
                    <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageHospitals.map((hospital) => (
                  <tr key={hospital.id} className="h-14 border-t border-[#DCE3EC]">
                    <td className="px-4 text-sm text-[#1E2A3A]">{hospital.name}</td>
                    <td className="px-4 text-sm text-[#5A6B80]">{hospital.region}</td>
                    <td className="px-4 text-sm text-[#1E2A3A]">{hospital.beds}</td>
                    <td className="px-4 text-sm text-[#1E2A3A]">{hospital.devices}</td>
                    <td className="px-4 text-sm text-[#1E2A3A]">{hospital.manager}</td>
                    <td className="px-4">
                      <span className="flex w-fit items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: hospital.active ? "#2FA35C" : "#8B9AAE" }}
                        />
                        <span className={`text-xs font-bold ${hospital.active ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                          {hospital.active ? "활성" : "비활성"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4">
                      <button
                        type="button"
                        aria-label={`${hospital.name} 관리`}
                        onClick={() => navigate(`/admin/hospitals/${encodeURIComponent(hospital.id)}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A6B80] hover:bg-[#EDF1F6]"
                      >
                        <Icon name="ellipsis" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pageHospitals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                      조건에 맞는 병원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {filteredHospitals.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#DCE3EC] px-4 py-3">
                <p className="text-xs text-[#5A6B80]">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredHospitals.length)} / {filteredHospitals.length}곳
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

      <AddHospitalModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAddHospital} />
    </div>
  );
}

export default AdminHospitalManagement;
