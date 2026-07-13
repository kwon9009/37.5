import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import AddDeviceModal from "../../../components/modals/add-device-modal/add-device-modal.jsx";
import { DEVICES as INITIAL_DEVICES } from "../../../data/admin.js";

const STATUS_TABS = ["전체", "온라인", "오프라인"];
const PAGE_SIZE = 5;

function AdminDeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [page, setPage] = useState(1);

  const handleAddDevice = (form) => {
    setDevices((current) => [
      { id: form.id, room: form.room || "-", bed: form.bed || "-", online: true, battery: 100, lastSeen: new Date().toLocaleTimeString("ko-KR", { hour12: false }) },
      ...current,
    ]);
  };

  const filteredDevices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesQuery =
        query === "" || device.id.toLowerCase().includes(query) || device.room.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "전체" || (statusFilter === "온라인" ? device.online : !device.online);
      return matchesQuery && matchesStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDevices = filteredDevices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-device-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="devices" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">장치 관리</h1>
              <p className="text-sm text-[#5A6B80]">병상에 부착된 모니터링 하드웨어의 연결 상태와 배터리 관리</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white"
            >
              <Icon name="plus" size={16} className="text-white" />
              장치 추가
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-full max-w-[280px] items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="search" size={16} className="shrink-0 text-[#5A6B80]" />
                <input
                  type="text"
                  placeholder="장치 ID 또는 병실 검색"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  className="w-full border-0 bg-transparent text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
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
            <h2 className="text-lg font-bold text-[#1E2A3A]">장치 목록</h2>
            <p className="text-[13px] text-[#5A6B80]">
              총 {devices.length}대 중 {filteredDevices.length}대 표시
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[710px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[17%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="h-12 bg-[#EDF1F6]">
                  {["장치 ID", "병실", "병상", "연결 상태", "배터리", "마지막 통신", "관리"].map((heading) => (
                    <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageDevices.map((device) => (
                  <tr key={device.id} className="h-14 border-t border-[#DCE3EC]">
                    <td className="px-4 text-[15px] font-semibold text-[#1E2A3A]">{device.id}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{device.room}</td>
                    <td className="px-4 text-[15px] font-semibold text-[#1E2A3A]">{device.bed}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-[6px]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: device.online ? "#2FA35C" : "#98A6B8" }}
                        />
                        <span className={`text-sm ${device.online ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                          {device.online ? "온라인" : "오프라인"}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 text-[15px] font-bold ${device.online ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                      {device.battery}%
                    </td>
                    <td className="px-4 text-[13px] text-[#5A6B80]">{device.lastSeen}</td>
                    <td className="px-4">
                      <button
                        type="button"
                        aria-label={`${device.id} 관리`}
                        onClick={() => navigate(`/admin/devices/${encodeURIComponent(device.id)}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF1F6] text-[#2B6FE3]"
                      >
                        <Icon name="settings" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pageDevices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                      조건에 맞는 장치가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {filteredDevices.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#DCE3EC] px-4 py-3">
                <p className="text-xs text-[#5A6B80]">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDevices.length)} / {filteredDevices.length}대
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

      <AddDeviceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAddDevice} />
    </div>
  );
}

export default AdminDeviceManagement;
