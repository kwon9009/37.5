import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import StatusBadge from "../../../components/status-badge/status-badge.jsx";

const KPIS = [
  { label: "배터리", value: "92%" },
  { label: "마지막 통신", value: "14:32:07" },
  { label: "가동 일수", value: "187일" },
  { label: "신호 강도", value: "우수", color: "#2FA35C" },
];

const COMM_LOG = [
  { time: "2026-07-09 14:32:07", event: "정상 통신", status: "정상" },
  { time: "2026-07-09 09:15:22", event: "재연결 완료", status: "정상" },
  { time: "2026-07-09 09:12:41", event: "일시적 연결 끊김", status: "경고" },
  { time: "2026-07-08 22:00:03", event: "정기 상태 점검", status: "정상" },
];

const STATUS_COLOR = { 정상: "#2FA35C", 경고: "#E8762B" };

const MAINTENANCE_HISTORY = [
  { icon: "wrench", iconBg: "#DCE8FB", iconColor: "#2B6FE3", message: "장치 최초 설치", time: "2025-11-04" },
  { icon: "download", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "펌웨어 업데이트 (v3.1→v3.2)", time: "2026-04-18" },
  { icon: "circle-check", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "정기 점검 완료", time: "2026-06-02" },
];

function DeviceDetail() {
  const { deviceId } = useParams();
  const deviceName = deviceId ? decodeURIComponent(deviceId) : "VG-302-A1";
  const [updating, setUpdating] = useState(false);

  const handleFirmwareUpdate = () => {
    setUpdating(true);
    setTimeout(() => setUpdating(false), 2000);
  };

  return (
    <div className="device-detail flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="devices" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={3} />

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
                <p className="font-mono text-[22px] font-bold text-[#1E2A3A]">{deviceName}</p>
                <p className="text-[13px] font-semibold text-[#5A6B80]">5병동 · 302호 · A-1 병상</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[10px]">
              <StatusBadge severity="normal" label="온라인" size="lg" />
              <button
                type="button"
                onClick={handleFirmwareUpdate}
                className="flex h-10 items-center gap-[6px] rounded-lg bg-[#EDF1F6] px-4 text-[13px] font-bold text-[#5A6B80]"
              >
                <Icon name="download" size={15} className="text-[#5A6B80]" />
                {updating ? "업데이트 중..." : "펌웨어 업데이트"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {KPIS.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="flex overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]"
                  >
                    <span className="w-1 shrink-0 bg-[#7C5CFC]" />
                    <div className="flex flex-col gap-[6px] p-[18px]">
                      <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{kpi.label}</p>
                      <p className="text-2xl font-extrabold" style={{ color: kpi.color ?? "#1E2A3A" }}>
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">이 장치가 측정 중인 실시간 값</p>
                </div>
                <div className="flex flex-col gap-5 p-5 sm:flex-row">
                  <div className="flex w-full flex-col gap-[6px]">
                    <p className="text-xs font-bold tracking-wide text-[#5A6B80]">심박</p>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[40px] font-extrabold leading-none text-[#1E2A3A]">78</span>
                      <span className="pb-1 text-sm text-[#5A6B80]">bpm</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-[6px]">
                    <p className="text-xs font-bold tracking-wide text-[#5A6B80]">호흡</p>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[40px] font-extrabold leading-none text-[#1E2A3A]">16</span>
                      <span className="pb-1 text-sm text-[#5A6B80]">회/분</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-[6px]">
                    <p className="text-xs font-bold tracking-wide text-[#5A6B80]">측정 범위</p>
                    <p className="text-[15px] font-semibold text-[#1E2A3A]">침대 반경 1.5m</p>
                    <p className="text-[13px] font-semibold text-[#2FA35C]">감지 정상</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[190px]" />
                    <col />
                    <col className="w-[110px]" />
                  </colgroup>
                  <thead>
                    <tr className="h-12 bg-[#EDF1F6]">
                      {["시각", "이벤트", "상태"].map((heading) => (
                        <th key={heading} scope="col" className="px-5 text-xs font-bold tracking-wide text-[#5A6B80]">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMM_LOG.map((row) => (
                      <tr key={row.time} className="h-[52px] border-t border-[#DCE3EC]">
                        <td className="px-5 font-mono text-xs text-[#5A6B80]">{row.time}</td>
                        <td className="px-5 text-[13px] font-semibold text-[#1E2A3A]">{row.event}</td>
                        <td className="px-5">
                          <span className="flex w-fit items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                            <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: STATUS_COLOR[row.status] }} />
                            <span className="text-xs font-bold text-[#1E2A3A]">{row.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">장치 정보</p>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {[
                    ["장치 ID", "VG-302-A1"],
                    ["모델명", "VitalGuard Radar S2"],
                    ["펌웨어 버전", "v3.2.1"],
                    ["설치일", "2025-11-04"],
                    ["담당 병실·병상", "302호 · A-1"],
                    ["소속 병원", "서울중앙병원"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className="font-mono text-[13px] font-bold text-[#1E2A3A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">배터리 추이</p>
                </div>
                <div className="flex flex-col gap-[10px] p-5">
                  {[
                    ["현재", "92%"],
                    ["어제 이 시각", "94%"],
                    ["지난주 평균", "89%"],
                    ["예상 교체 시기", "약 4개월 후"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className="font-mono text-[13px] font-bold text-[#1E2A3A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">점검 이력</p>
                </div>
                <div className="flex flex-col">
                  {MAINTENANCE_HISTORY.map((item) => (
                    <div
                      key={item.message}
                      className="flex items-center gap-3 border-b border-[#DCE3EC] px-5 py-[14px] last:border-b-0"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: item.iconBg }}
                      >
                        <Icon name={item.icon} size={16} style={{ color: item.iconColor }} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">{item.message}</p>
                        <p className="font-mono text-[11px] text-[#5A6B80]">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;
