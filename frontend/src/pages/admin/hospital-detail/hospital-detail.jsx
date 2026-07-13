import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import StatusBadge from "../../../components/status-badge/status-badge.jsx";

const KPIS = [
  { label: "총 병상 수", value: 820, accent: "#1E2A3A" },
  { label: "연결 장치", value: 342, accent: "#2B6FE3" },
  { label: "재실 환자", value: 705, accent: "#2FA35C" },
  { label: "낙상 위험 환자", value: 6, accent: "#E8A13B" },
];

const WARDS = [
  { name: "3병동", beds: 180, occupied: 158, devices: 78 },
  { name: "4병동", beds: 170, occupied: 149, devices: 74 },
  { name: "5병동", beds: 160, occupied: 132, devices: 70 },
  { name: "6병동", beds: 150, occupied: 120, devices: 64 },
  { name: "중환자실", beds: 160, occupied: 146, devices: 56 },
];

const DEVICE_STATS = [
  { label: "온라인", color: "#2FA35C", value: 328 },
  { label: "오프라인", color: "#E0442E", value: 9 },
  { label: "배터리부족", color: "#E8A13B", value: 5 },
];

const RECENT_ACTIVITY = [
  { icon: "cpu", iconBg: "#DCE8FB", iconColor: "#2B6FE3", message: "장치 12대 신규 연결", time: "2026-07-08 09:14" },
  { icon: "user-cog", iconBg: "#FCF0DC", iconColor: "#E8A13B", message: "담당 관리자 변경 · 김도현", time: "2026-07-05 16:40" },
  { icon: "bed", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "병상 정보 업데이트 · 820병상", time: "2026-07-02 11:05" },
  { icon: "key-round", iconBg: "#EDF1F6", iconColor: "#5A6B80", message: "병원코드 재발급", time: "2026-06-27 14:22" },
];

function HospitalDetail() {
  const { hospitalId } = useParams();
  const hospitalName = hospitalId ? decodeURIComponent(hospitalId) : "서울중앙병원";
  const [active, setActive] = useState(true);

  return (
    <div className="hospital-detail flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="hospitals" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={5} />

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
                  <p className="text-2xl font-bold text-[#1E2A3A]">{hospitalName}</p>
                  <span className="flex items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                    <Icon name="map-pin" size={12} className="text-[#5A6B80]" />
                    <span className="text-xs font-bold text-[#5A6B80]">수도권 · 서울</span>
                  </span>
                  <StatusBadge severity={active ? "normal" : "offline"} label={active ? "활성" : "비활성"} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#EDF1F6] px-3 py-[6px]">
                    <Icon name="key-round" size={14} className="text-[#2B6FE3]" />
                    <span className="text-xs font-semibold text-[#5A6B80]">병원코드</span>
                    <span className="font-mono text-[13px] font-bold text-[#1E2A3A]">WSH-2026-0417</span>
                  </span>
                  <span className="text-xs text-[#5A6B80]">환자·보호자 연동 요청 시 이 코드를 안내하세요</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-[10px]">
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-[13px] font-bold text-white"
              >
                <Icon name="pencil" size={16} className="text-white" />
                수정
              </button>
              <button
                type="button"
                onClick={() => setActive((current) => !current)}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#E0442E] bg-white px-4 text-[13px] font-bold text-[#E0442E]"
              >
                <Icon name="power-off" size={16} className="text-[#E0442E]" />
                {active ? "비활성화" : "활성화"}
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
                <p className="text-[13px] text-[#5A6B80]">{WARDS.length}개 병동</p>
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
                    {WARDS.map((ward) => (
                      <tr key={ward.name} className="h-14 border-t border-[#DCE3EC]">
                        <td className="px-4 text-sm font-semibold text-[#1E2A3A]">{ward.name}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.beds}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.occupied}</td>
                        <td className="px-4 text-sm text-[#1E2A3A]">{ward.devices}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">연결 장치 현황</p>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                  {DEVICE_STATS.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-2">
                      <div className="flex items-center gap-[6px]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-xs font-bold text-[#5A6B80]">{stat.label}</span>
                      </div>
                      <span className="text-2xl font-extrabold text-[#1E2A3A]">{stat.value}</span>
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
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCE3EC] bg-[#EDF1F6] text-base font-bold text-[#1E2A3A]">
                      김
                    </span>
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-[15px] font-bold text-[#1E2A3A]">김도현</p>
                      <p className="text-xs text-[#5A6B80]">병원 관리자</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#DCE3EC]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">이메일</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">dh.kim@seoulcentral.hosp.kr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">연락처</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">010-4821-7735</span>
                  </div>
                  <button
                    type="button"
                    className="flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#2B6FE3] text-sm font-bold text-white"
                  >
                    <Icon name="message-circle" size={16} className="text-white" />
                    담당 관리자에게 메시지 보내기
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">병원 정보</p>
                </div>
                <div className="flex flex-col gap-[10px] p-[17px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">주소</span>
                    <span className="text-[13px] font-semibold text-[#1E2A3A]">서울 종로구 대학로 101</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">대표전화</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">02-2072-0114</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">가입일</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">2024.03.18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">계약 상태</span>
                    <span className="flex items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-1">
                      <span className="h-2 w-2 rounded-full bg-[#2FA35C]" />
                      <span className="text-xs font-bold text-[#1E2A3A]">정식 계약</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">병원 유형</span>
                    <span className="text-[13px] font-semibold text-[#1E2A3A]">상급종합병원</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">최근 활동</p>
                </div>
                <div className="flex flex-col">
                  {RECENT_ACTIVITY.map((item) => (
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

export default HospitalDetail;
