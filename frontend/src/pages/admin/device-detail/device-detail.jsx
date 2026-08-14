import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import StatusBadge from "../../../components/status-badge/status-badge.jsx";
import { apiClient } from "../../../api/client.js";

const STATUS_LABEL = { ACTIVE: "온라인", OFFLINE: "오프라인", ERROR: "오류" };
const STATUS_SEVERITY = { ACTIVE: "normal", OFFLINE: "offline", ERROR: "emergency" };

function formatDateTime(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("ko-KR", { hour12: false });
}

function daysSince(isoString) {
  if (!isoString) return "-";
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
  return `${days}일`;
}

function DeviceDetail() {
  const { deviceId } = useParams();
  const [detail, setDetail] = useState(null);
  const [vital, setVital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    Promise.all([
      apiClient.get(`/admin/devices/${deviceId}`),
      apiClient.get(`/admin/devices/${deviceId}/vitals/latest`),
    ])
      .then(([detailRes, vitalRes]) => {
        if (cancelled) return;
        setDetail(detailRes.data);
        setVital(vitalRes.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("장치 정보를 불러오지 못했습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="device-detail flex min-h-screen bg-[#F5F7FA]">
        <AdminSidebar active="devices" />
        <div className="flex min-h-screen w-full flex-col">
          <AdminHeader />
          <p className="p-6 text-sm text-[#5A6B80]">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="device-detail flex min-h-screen bg-[#F5F7FA]">
        <AdminSidebar active="devices" />
        <div className="flex min-h-screen w-full flex-col">
          <AdminHeader />
          <p className="p-6 text-sm text-[#E0442E]">{loadError || "존재하지 않는 장치입니다"}</p>
        </div>
      </div>
    );
  }

  const location = detail.room_num != null ? `${detail.ward} · ${detail.room_num}호 · ${detail.bed_num}번 침대` : "환자 미배정 (재고)";

  return (
    <div className="device-detail flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="devices" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader />

        <div className="flex flex-col gap-5 p-6">
          <Link to="/admin/devices" className="flex w-fit items-center gap-[6px] text-[#7C5CFC]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">장치 관리 목록으로</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "#2B6FE333" }}
              >
                <Icon name="cpu" size={26} className="text-[#7C5CFC]" />
              </span>
              <div className="flex flex-col gap-[5px]">
                <p className="font-mono text-[22px] font-bold text-[#1E2A3A]">{detail.serial_num}</p>
                <p className="text-[13px] font-semibold text-[#5A6B80]">
                  {detail.hospital_name} · {location}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[10px]">
              <StatusBadge severity={STATUS_SEVERITY[detail.status]} label={STATUS_LABEL[detail.status]} size="lg" />
              {/* 펌웨어 업데이트: 백엔드에 장치 펌웨어 개념/API가 아직 없어 비활성 처리 */}
              <button
                type="button"
                disabled
                title="펌웨어 관리 기능은 아직 준비 중입니다"
                className="flex h-10 items-center gap-[6px] rounded-lg bg-[#EDF1F6] px-4 text-[13px] font-bold text-[#8B9AAE] opacity-60"
              >
                <Icon name="download" size={15} className="text-[#8B9AAE]" />
                펌웨어 업데이트
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "마지막 통신", value: formatDateTime(detail.updated_at) },
                  { label: "가동 일수", value: daysSince(detail.created_at) },
                  {
                    label: "연결 상태",
                    value: STATUS_LABEL[detail.status],
                    color: detail.status === "ERROR" ? "#E0442E" : detail.status === "OFFLINE" ? "#8B9AAE" : "#2FA35C",
                  },
                  // 배터리: 하드웨어가 아직 배터리 잔량을 보고하지 않아 서버에 값이 없다(향후 지원 예정)
                  { label: "배터리", value: "준비 중", muted: true },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="flex overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]"
                  >
                    <span className={`w-1 shrink-0 ${kpi.muted ? "bg-[#DCE3EC]" : "bg-[#7C5CFC]"}`} />
                    <div className="flex flex-col gap-[6px] p-[18px]">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{kpi.label}</p>
                      <p
                        className={kpi.muted ? "text-lg font-bold text-[#8B9AAE]" : "text-2xl font-extrabold"}
                        style={{ color: kpi.muted ? undefined : kpi.color ?? "#1E2A3A" }}
                      >
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">이 장치가 측정 중인 최근 1분 평균값</p>
                </div>
                {vital && vital.heart_rate != null ? (
                  <div className="flex flex-col gap-5 p-5 sm:flex-row">
                    <div className="flex w-full flex-col gap-[6px]">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">심박</p>
                      <div className="flex items-end gap-[6px]">
                        <span className="text-[40px] font-extrabold leading-none text-[#1E2A3A]">{vital.heart_rate}</span>
                        <span className="pb-1 text-sm text-[#5A6B80]">bpm</span>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-[6px]">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">호흡</p>
                      <div className="flex items-end gap-[6px]">
                        <span className="text-[40px] font-extrabold leading-none text-[#1E2A3A]">{vital.resp_rate}</span>
                        <span className="pb-1 text-sm text-[#5A6B80]">회/분</span>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-[6px]">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">측정 시각</p>
                      <p className="text-[15px] font-semibold text-[#1E2A3A]">{formatDateTime(vital.recorded_at)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="p-5 text-sm text-[#5A6B80]">
                    {detail.room_num != null ? "아직 쌓인 측정값이 없습니다." : "환자 미배정 상태라 측정값이 없습니다."}
                  </p>
                )}
              </div>

              {/* 통신 로그: 장치별 이벤트 로그를 쌓는 테이블/API가 아직 없다(향후 지원 예정) */}
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">통신 로그</p>
                </div>
                <p className="p-5 text-sm text-[#5A6B80]">준비 중입니다 (통신 로그 API 미구현)</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">장치 정보</p>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {[
                    ["시리얼 번호", detail.serial_num, false],
                    ["소속 병원", detail.hospital_name, false],
                    ["담당 병동", detail.ward ?? "-", false],
                    ["담당 병실·병상", detail.room_num != null ? `${detail.room_num}호 · ${detail.bed_num}번` : "미배정", false],
                    ["등록일", formatDateTime(detail.created_at), false],
                    // 모델명/펌웨어 버전: 서버가 아직 안 내려주는 필드 (향후 지원 예정)
                    ["모델명", "준비 중", true],
                    ["펌웨어 버전", "준비 중", true],
                  ].map(([label, value, muted]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className={`font-mono text-[13px] font-bold ${muted ? "text-[#8B9AAE]" : "text-[#1E2A3A]"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 점검 이력: 장치 정비/설치 이력을 남기는 테이블/API가 아직 없다(향후 지원 예정) */}
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">점검 이력</p>
                </div>
                <p className="p-5 text-sm text-[#5A6B80]">준비 중입니다 (점검 이력 API 미구현)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;
