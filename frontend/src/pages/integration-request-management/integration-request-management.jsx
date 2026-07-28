import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";

const TABS = ["대기중", "승인됨", "거절됨", "전체"];

const KPIS = [
  { label: "대기중 요청", value: 3, color: "#E8A13B", bg: "#FFFFFF" },
  { label: "이번주 승인", value: 12, color: "#2FA35C", bg: "#FFFFFF" },
  { label: "평균 처리 시간", value: "4.2시간", color: "#1E2A3A", bg: "#FFFFFF" },
];

const INITIAL_REQUESTS = [
  { id: "김보라", requester: "김보라", phone: "010-2231-5567", patientName: "이순자", birthDate: "1948-03-12", hospitalCode: "WSH-2026-0512", requestedAt: "2026-07-08 14:22", status: "대기중" },
  { id: "박현수", requester: "박현수", phone: "010-8842-1190", patientName: "박현수", birthDate: "1955-11-02", hospitalCode: "WSH-2026-0498", requestedAt: "2026-07-08 09:47", status: "대기중" },
  { id: "정다은", requester: "정다은", phone: "010-5567-3321", patientName: "정만철", birthDate: "1962-06-24", hospitalCode: "WSH-2026-0501", requestedAt: "2026-07-07 21:03", status: "대기중" },
  { id: "이수민", requester: "이수민", phone: "010-3312-7789", patientName: "이영옥", birthDate: "1950-01-30", hospitalCode: "WSH-2026-0455", requestedAt: "2026-07-06 11:15", status: "승인됨" },
  { id: "최지훈", requester: "최지훈", phone: "010-9081-2234", patientName: "최말순", birthDate: "1945-09-18", hospitalCode: "WSH-2026-0432", requestedAt: "2026-07-05 16:40", status: "승인됨" },
  { id: "한소영", requester: "한소영", phone: "010-6674-8821", patientName: "한동혁", birthDate: "1970-04-05", hospitalCode: "WSH-2026-0410", requestedAt: "2026-07-04 08:52", status: "승인됨" },
  { id: "오재민", requester: "오재민", phone: "010-4453-9967", patientName: "오순영", birthDate: "1958-12-27", hospitalCode: "WSH-2026-0388", requestedAt: "2026-07-03 19:30", status: "거절됨" },
];

const STATUS_STYLE = {
  대기중: { severity: "caution" },
  승인됨: { severity: "normal" },
  거절됨: { severity: "offline" },
};

function IntegrationRequestManagement() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState("대기중");

  const filteredRequests = useMemo(
    () => (activeTab === "전체" ? requests : requests.filter((item) => item.status === activeTab)),
    [requests, activeTab]
  );

  const handleApprove = (id) => {
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, status: "승인됨" } : item)));
  };

  return (
    <div className="integration-request-management flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="integration" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#1E2A3A]">환자 연동 요청 관리</h1>
            <p className="text-sm text-[#5A6B80]">보호자·환자 앱에서 접수된 연동 요청을 확인하고 승인하세요</p>
          </div>

          <div className="flex gap-1 border-b border-[#DCE3EC]">
            {TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="flex w-[108px] flex-col items-center gap-[10px] pt-[10px]"
                >
                  <span className={`text-sm ${isActive ? "font-bold text-[#1E2A3A]" : "font-semibold text-[#5A6B80]"}`}>
                    {tab}
                  </span>
                  <span className="h-[2px] w-full" style={{ backgroundColor: isActive ? "#2B6FE3" : "transparent" }} />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {KPIS.map((kpi) => (
              <div
                key={kpi.label}
                className="flex overflow-hidden rounded-xl border border-[#DCE3EC] shadow-[0_2px_3px_rgba(30,42,58,0.08)]"
                style={{ backgroundColor: kpi.bg }}
              >
                <span className="w-1 shrink-0" style={{ backgroundColor: kpi.color }} />
                <div className="flex flex-col gap-2 p-6">
                  <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{kpi.label}</p>
                  <p className="text-[32px] font-extrabold" style={{ color: kpi.color }}>
                    {kpi.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1E2A3A]">연동 요청 목록</h2>
            <p className="text-[13px] text-[#5A6B80]">총 {requests.length}건</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="h-12 bg-[#EDF1F6]">
                  {["요청자", "연락처", "환자이름", "환자 생년월일", "병원코드", "요청일시", "상태", "관리"].map((heading) => (
                    <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="h-16 border-t border-[#DCE3EC]">
                    <td className="px-4 text-[15px] font-semibold text-[#1E2A3A]">{req.requester}</td>
                    <td className="px-4 font-mono text-[13px] text-[#1E2A3A]">{req.phone}</td>
                    <td className="px-4 text-sm text-[#1E2A3A]">{req.patientName}</td>
                    <td className="px-4 font-mono text-xs text-[#5A6B80]">{req.birthDate}</td>
                    <td className="px-4 font-mono text-xs font-semibold text-[#1E2A3A]">{req.hospitalCode}</td>
                    <td className="px-4 font-mono text-xs text-[#5A6B80]">{req.requestedAt}</td>
                    <td className="px-4">
                      <StatusBadge severity={STATUS_STYLE[req.status].severity} label={req.status} />
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        {req.status === "대기중" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center gap-1 rounded-lg bg-[#2FA35C] px-3 py-[6px] text-xs font-bold text-white"
                          >
                            <Icon name="check" size={13} className="text-white" />
                            승인
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/integration-requests/${encodeURIComponent(req.id)}`)}
                          className="flex items-center gap-1 rounded-lg bg-[#EDF1F6] px-3 py-[6px] text-xs font-semibold text-[#5A6B80]"
                        >
                          상세보기
                          {req.status !== "대기중" && <Icon name="chevron-right" size={14} className="text-[#5A6B80]" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                      해당 상태의 연동 요청이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationRequestManagement;
