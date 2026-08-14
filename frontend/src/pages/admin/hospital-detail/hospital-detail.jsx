import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import StatusBadge from "../../../components/status-badge/status-badge.jsx";
import AddHospitalModal from "../../../components/modals/add-hospital-modal/add-hospital-modal.jsx";
import { apiClient } from "../../../api/client.js";

const DEVICE_STAT_META = [
  { key: "active", label: "온라인", color: "#2FA35C" },
  { key: "offline", label: "오프라인", color: "#8B9AAE" },
  { key: "error", label: "오류", color: "#E0442E" },
];

function formatDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function HospitalDetail() {
  const { hospitalId } = useParams();

  const [detail, setDetail] = useState(null);
  const [wards, setWards] = useState([]);
  const [deviceStats, setDeviceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [areaOptions, setAreaOptions] = useState([]);
  const [adminOptions, setAdminOptions] = useState([]);

  const loadDetail = () =>
    Promise.all([
      apiClient.get(`/admin/hospitals/${hospitalId}`),
      apiClient.get(`/admin/hospitals/${hospitalId}/wards`),
      apiClient.get(`/admin/hospitals/${hospitalId}/devices/stats`),
    ]).then(([detailRes, wardsRes, statsRes]) => {
      setDetail(detailRes.data);
      setWards(wardsRes.data);
      setDeviceStats(statsRes.data);
    });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    loadDetail()
      .catch(() => {
        if (!cancelled) setLoadError("병원 정보를 불러오지 못했습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    apiClient
      .get("/hospitals/areas")
      .then(({ data }) => setAreaOptions(data))
      .catch(() => {});
    apiClient
      .get("/admin/names")
      .then(({ data }) => setAdminOptions(data))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  const handleEditSubmit = (form) => apiClient.put(`/admin/hospitals/${hospitalId}`, form).then(loadDetail);

  const handleToggleActive = () => {
    setStatusUpdating(true);
    apiClient
      .patch(`/admin/hospitals/${hospitalId}/status`, { is_active: !detail.is_active })
      .then(({ data }) => setDetail(data))
      .finally(() => setStatusUpdating(false));
  };

  if (loading) {
    return (
      <div className="hospital-detail flex min-h-screen bg-[#F5F7FA]">
        <AdminSidebar active="hospitals" />
        <div className="flex min-h-screen w-full flex-col">
          <AdminHeader />
          <p className="p-6 text-sm text-[#5A6B80]">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="hospital-detail flex min-h-screen bg-[#F5F7FA]">
        <AdminSidebar active="hospitals" />
        <div className="flex min-h-screen w-full flex-col">
          <AdminHeader />
          <p className="p-6 text-sm text-[#E0442E]">{loadError || "존재하지 않는 병원입니다"}</p>
        </div>
      </div>
    );
  }

  const occupiedTotal = wards.reduce((sum, ward) => sum + ward.occupied, 0);
  const deviceTotal = deviceStats ? deviceStats.active + deviceStats.offline + deviceStats.error : 0;

  const kpis = [
    { label: "총 병상 수", value: detail.bed_count, accent: "#1E2A3A" },
    { label: "연결 장치", value: deviceTotal, accent: "#2B6FE3" },
    { label: "재실 환자", value: occupiedTotal, accent: "#2FA35C" },
  ];

  return (
    <div className="hospital-detail flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="hospitals" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader />

        <div className="flex flex-col gap-5 p-6">
          <Link to="/admin/hospitals" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">병원 관리 목록으로</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#DCE3EC] bg-[#EDF1F6]">
                <Icon name="building-2" size={30} className="text-[#5A6B80]" />
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <p className="text-2xl font-bold text-[#1E2A3A]">{detail.name}</p>
                  <span className="flex items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                    <Icon name="map-pin" size={12} className="text-[#5A6B80]" />
                    <span className="text-xs font-bold text-[#5A6B80]">{detail.area}</span>
                  </span>
                  <StatusBadge
                    severity={detail.is_active ? "normal" : "offline"}
                    label={detail.is_active ? "활성" : "비활성"}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#EDF1F6] px-3 py-[6px]">
                    <Icon name="key-round" size={14} className="text-[#2B6FE3]" />
                    <span className="text-xs font-semibold text-[#5A6B80]">병원코드</span>
                    <span className="font-mono text-[13px] font-bold text-[#1E2A3A]">{detail.hospital_code}</span>
                  </span>
                  <span className="text-xs text-[#5A6B80]">환자·보호자 연동 요청 시 이 코드를 안내하세요</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-[10px]">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-[13px] font-bold text-white"
              >
                <Icon name="pencil" size={16} className="text-white" />
                수정
              </button>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={statusUpdating}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#E0442E] bg-white px-4 text-[13px] font-bold text-[#E0442E] disabled:opacity-60"
              >
                <Icon name="power-off" size={16} className="text-[#E0442E]" />
                {detail.is_active ? "비활성화" : "활성화"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="flex overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]"
                  >
                    <span className="w-1 shrink-0" style={{ backgroundColor: kpi.accent }} />
                    <div className="flex flex-col gap-2 p-6">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{kpi.label}</p>
                      <p className="text-[32px] font-extrabold text-[#1E2A3A]">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#1E2A3A]">병동 현황</h2>
                <p className="text-[13px] text-[#5A6B80]">{wards.length}개 병동</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[21%]" />
                  </colgroup>
                  <thead>
                    <tr className="h-12 bg-[#EDF1F6]">
                      {["병동명", "병상 수", "재실 환자", "연결 장치"].map((heading) => (
                        <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wards.map((ward) => (
                      <tr key={ward.department_id} className="h-14 border-t border-[#DCE3EC]">
                        <td className="px-4 text-sm font-semibold text-[#1E2A3A]">{ward.name}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.beds}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.occupied}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.devices}</td>
                      </tr>
                    ))}
                    {wards.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#5A6B80]">
                          등록된 병동이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">연결 장치 현황</p>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                  {DEVICE_STAT_META.map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-2">
                      <div className="flex items-center gap-[6px]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-xs font-bold text-[#5A6B80]">{stat.label}</span>
                      </div>
                      <span className="text-2xl font-extrabold text-[#1E2A3A]">{deviceStats?.[stat.key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">담당 관리자</p>
                </div>
                {detail.manager ? (
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCE3EC] bg-[#EDF1F6] text-base font-bold text-[#1E2A3A]">
                        {detail.manager.name.slice(0, 1)}
                      </span>
                      <div className="flex flex-col gap-[3px]">
                        <p className="text-[15px] font-bold text-[#1E2A3A]">{detail.manager.name}</p>
                        <p className="text-xs text-[#5A6B80]">병원 관리자</p>
                      </div>
                    </div>
                    <div className="h-px bg-[#DCE3EC]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">이메일</span>
                      <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">{detail.manager.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">연락처</span>
                      <a
                        href={`tel:${detail.manager.phone}`}
                        className="font-mono text-[13px] font-semibold text-[#2B6FE3] hover:underline"
                      >
                        {detail.manager.phone}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-[#5A6B80]">지정된 담당 관리자가 없습니다.</p>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">병원 정보</p>
                </div>
                <div className="flex flex-col gap-[10px] p-[17px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">주소</span>
                    <span className="text-[13px] font-semibold text-[#1E2A3A]">{detail.address}</span>
                  </div>
                  {/*
                    hospitals.phone 컬럼은 DB에 있지만(보호자 앱 "병원 연락하기"용),
                    AdminHospitalDetailResponse 스키마에는 아직 노출되지 않는다.
                    백엔드에서 phone 필드를 상세 응답에 추가하면 여기도 실데이터로 교체.
                  */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">대표전화</span>
                    <span className="font-mono text-[13px] font-semibold text-[#8B9AAE]">
                      정보 없음 (백엔드 응답에 phone 미포함)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">가입일</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">{formatDate(detail.created_at)}</span>
                  </div>
                  {/*
                    계약 상태: 트라이얼/정식 계약, 만기일 등 계약 생명주기 개념이
                    아직 DB에 없다. 다음 스프린트 과제로 미룸 — 그때 hospitals에
                    contract_type/contract_end_date 추가하고 이 자리를 채운다.
                  */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">계약 상태</span>
                    <span className="text-xs font-semibold text-[#8B9AAE]">미지원 (백엔드 필드 없음)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddHospitalModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        mode="edit"
        initialValues={{
          name: detail.name,
          hospital_code: detail.hospital_code,
          area: detail.area,
          address: detail.address,
          bed_count: detail.bed_count,
          admin_id: detail.manager?.admin_id ?? "",
        }}
        areaOptions={areaOptions}
        adminOptions={adminOptions}
      />
    </div>
  );
}

export default HospitalDetail;
