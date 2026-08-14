import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import AddDeviceModal from "../../../components/modals/add-device-modal/add-device-modal.jsx";
import { apiClient } from "../../../api/client.js";

const STATUS_TABS = [
  { label: "전체", value: null },
  { label: "온라인", value: "ACTIVE" },
  { label: "오프라인", value: "OFFLINE" },
  { label: "오류", value: "ERROR" },
];

const STATUS_LABEL = { ACTIVE: "온라인", OFFLINE: "오프라인", ERROR: "오류" };
const STATUS_COLOR = { ACTIVE: "#2FA35C", OFFLINE: "#98A6B8", ERROR: "#E0442E" };

const PAGE_SIZE = 5;

function formatDateTime(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("ko-KR", { hour12: false });
}

function AdminDeviceManagement() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [total, setTotal] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_TABS[0]);
  const [page, setPage] = useState(1);
  const [hospitalOptions, setHospitalOptions] = useState([]);

  const loadDevices = () => {
    apiClient
      .get("/admin/devices", {
        params: {
          search: searchQuery.trim() || undefined,
          status: statusFilter.value ?? undefined,
          page,
          page_size: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        setDevices(data.items);
        setTotal(data.total);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    apiClient
      .get("/admin/hospitals")
      .then(({ data }) => setHospitalOptions(data.map((h) => ({ hospital_id: h.hospital_id, name: h.name }))))
      .catch(() => {});
  }, []);

  const handleAddDevice = (form) => apiClient.post("/admin/devices", form).then(() => loadDevices());

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-device-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="devices" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">장치 관리</h1>
              <p className="text-sm text-[#5A6B80]">병상에 부착된 모니터링 하드웨어의 연결 상태 관리</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white"
            >
              <Icon name="plus" size={16} className="text-white" />
              장치 재고 등록
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-full max-w-[320px] items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
                <Icon name="search" size={16} className="shrink-0 text-[#5A6B80]" />
                <input
                  type="text"
                  placeholder="시리얼 번호, 병원명, 병동 검색"
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
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-[6px] text-xs font-semibold ${
                      statusFilter.label === tab.label ? "bg-[#2B6FE3] text-white" : "text-[#5A6B80]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1E2A3A]">장치 목록</h2>
            <p className="text-[13px] text-[#5A6B80]">총 {total}대</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="h-12 bg-[#EDF1F6]">
                  {["시리얼 번호", "병원", "위치", "연결 상태", "마지막 통신", "관리"].map((heading) => (
                    <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.device_id} className="h-14 border-t border-[#DCE3EC]">
                    <td className="px-4 text-[15px] font-semibold font-mono text-[#1E2A3A]">{device.serial_num}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{device.hospital_name}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">
                      {device.room_num != null
                        ? `${device.ward} ${device.room_num}호-${device.bed_num}`
                        : <span className="text-[#8B9AAE]">미배정</span>}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-[6px]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[device.status] }}
                        />
                        <span className="text-sm text-[#1E2A3A]">{STATUS_LABEL[device.status]}</span>
                      </div>
                    </td>
                    <td className="px-4 text-[13px] text-[#5A6B80]">{formatDateTime(device.updated_at)}</td>
                    <td className="px-4">
                      <button
                        type="button"
                        aria-label={`${device.serial_num} 관리`}
                        onClick={() => navigate(`/admin/devices/${device.device_id}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF1F6] text-[#2B6FE3]"
                      >
                        <Icon name="settings" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                      조건에 맞는 장치가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {total > 0 && (
              <div className="flex items-center justify-between border-t border-[#DCE3EC] px-4 py-3">
                <p className="text-xs text-[#5A6B80]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}대
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A6B80] hover:bg-[#EDF1F6] disabled:opacity-30"
                  >
                    <Icon name="chevron-left" size={16} />
                  </button>
                  <span className="px-2 text-xs font-semibold text-[#1E2A3A]">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={page === totalPages}
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

      <AddDeviceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddDevice}
        hospitalOptions={hospitalOptions}
      />
    </div>
  );
}

export default AdminDeviceManagement;
