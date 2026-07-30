import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";

const MATCH_FIELDS = [
  { label: "환자 이름", submitted: "김영자", system: "김영자" },
  { label: "환자 생년월일", submitted: "1959-03-12", system: "1959-03-12" },
  { label: "병원코드", submitted: "WSH-2026-0512", system: "WSH-2026-0512" },
];

const SUBMITTED_INFO = [
  ["요청자 이름", "김민재"],
  ["연락처", "010-7734-2891"],
  ["환자 이름", "김영자"],
  ["환자 생년월일", "1959-03-12"],
  ["병원코드", "WSH-2026-0512"],
];

const INITIAL_HISTORY = [
  { icon: "send", iconBg: "#DCE8FB", iconColor: "#2B6FE3", message: "보호자 앱에서 연동 요청 접수", time: "08:41:02" },
  { icon: "search-check", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "시스템 자동 매칭 완료 · 3/3 항목 일치", time: "08:41:05" },
  { icon: "clock-3", iconBg: "#FBEBDD", iconColor: "#E8A13B", message: "담당자 검토 대기 중", time: "대기중" },
];

function formatNow() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

function IntegrationRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const requesterName = requestId ? decodeURIComponent(requestId) : "김민재";

  const [status, setStatus] = useState("대기중");
  const [rejectReason, setRejectReason] = useState("");
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const handleApprove = () => {
    setStatus("승인됨");
    setHistory((current) => [
      ...current.slice(0, -1),
      { icon: "check", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "담당자가 연동 요청을 승인했습니다", time: formatNow() },
    ]);
  };

  const handleReject = () => {
    setStatus("거절됨");
    setHistory((current) => [
      ...current.slice(0, -1),
      {
        icon: "x",
        iconBg: "#FDEDEA",
        iconColor: "#E0442E",
        message: rejectReason.trim() ? `담당자가 연동 요청을 거절했습니다 · ${rejectReason.trim()}` : "담당자가 연동 요청을 거절했습니다",
        time: formatNow(),
      },
    ]);
  };

  return (
    <div className="integration-request-detail flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="integration" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-5 p-6">
          <Link to="/integration-requests" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">연동 요청 목록으로</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FDEDEA]">
                <Icon name="user-check" size={26} className="text-[#E8A13B]" />
              </span>
              <div className="flex flex-col gap-[5px]">
                <p className="text-[22px] font-bold text-[#1E2A3A]">{requesterName} 님의 연동 요청</p>
                <p className="font-mono text-xs font-semibold text-[#5A6B80]">요청번호 REQ-2026-0709-014</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge
                severity={status === "대기중" ? "caution" : status === "승인됨" ? "normal" : "offline"}
                label={status}
                size="lg"
              />
              <p className="font-mono text-xs font-semibold text-[#5A6B80]">2026-07-09 08:41 접수</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">요청자 제출 정보</p>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {SUBMITTED_INFO.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className="font-mono text-sm font-bold text-[#1E2A3A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#2FA35C] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">시스템 매칭 결과</p>
                  <span className="flex items-center gap-[5px] rounded-full bg-[#2FA35C] px-[10px] py-[5px] text-xs font-bold text-white">
                    <Icon name="check" size={13} className="text-white" />
                    3/3 항목 일치
                  </span>
                </div>
                <div className="flex flex-col gap-[10px] p-5">
                  {MATCH_FIELDS.map((field) => (
                    <div key={field.label} className="flex items-center gap-3">
                      <span className="w-[120px] shrink-0 text-xs font-bold tracking-wide text-[#5A6B80]">
                        {field.label}
                      </span>
                      <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">{field.submitted}</span>
                      <Icon name="arrow-right" size={14} className="text-[#5A6B80]" />
                      <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">{field.system}</span>
                      <Icon name="circle-check" size={16} className="text-[#2FA35C]" />
                    </div>
                  ))}

                  <div className="h-px bg-[#DCE3EC]" />

                  <div className="flex items-center gap-[14px] rounded-[10px] bg-[#EDF1F6] p-[14px]">
                    <span className="h-12 w-12 shrink-0 rounded-full border border-[#DCE3EC] bg-white" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-[15px] font-bold text-[#1E2A3A]">김영자 (67세 · 여성)</p>
                      <p className="text-xs text-[#5A6B80]">3병동 · 302호 · A-1 · 담당 김간호 RN</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/patients/김영자")}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs font-semibold text-[#5A6B80]"
                    >
                      환자 상세보기
                      <Icon name="chevron-right" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">요청 처리</p>
                </div>
                <div className="flex flex-col gap-[14px] p-5">
                  {status === "대기중" ? (
                    <>
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="flex h-[46px] items-center justify-center gap-2 rounded-lg bg-[#2FA35C] text-sm font-bold text-white"
                      >
                        <Icon name="check" size={16} className="text-white" />
                        연동 승인
                      </button>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="rejectReason" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                          거절 사유 (거절 시 입력)
                        </label>
                        <textarea
                          id="rejectReason"
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          placeholder="예: 병원코드가 환자 정보와 일치하지 않습니다"
                          className="h-[70px] resize-none rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] p-[10px] text-[13px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleReject}
                        className="flex h-[46px] items-center justify-center gap-2 rounded-lg border border-[#E0442E] bg-white text-sm font-bold text-[#E0442E]"
                      >
                        <Icon name="x" size={16} className="text-[#E0442E]" />
                        연동 거절
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-[#5A6B80]">
                      이 요청은 이미 <span className="font-bold text-[#1E2A3A]">{status}</span> 처리되었습니다.
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">처리 이력</p>
                </div>
                <div className="flex flex-col">
                  {history.map((item) => (
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

export default IntegrationRequestDetail;
