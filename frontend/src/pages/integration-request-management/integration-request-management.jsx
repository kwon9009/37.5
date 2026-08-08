import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import {
  approveLinkRequest,
  errorMessage,
  fetchLinkRequests,
  rejectLinkRequest,
} from "../../api/patient-link-requests.js";

const TABS = ["대기중", "승인됨", "거절됨", "전체"];

const STATUS_STYLE = {
  대기중: { severity: "caution" },
  승인됨: { severity: "normal" },
  거절됨: { severity: "offline" },
};

/** 이번 주(월요일 0시부터)에 처리된 것만 센다 */
function isThisWeek(dateText) {
  if (!dateText) return false;
  const date = new Date(dateText.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return false;

  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  // getDay(): 일=0 이라 월요일까지 며칠 빼야 하는지 따로 계산한다
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return date >= monday;
}

/** 접수 -> 처리까지 걸린 평균 시간 */
function averageHandlingTime(requests) {
  const spans = requests
    .filter((req) => req.requestedAt && req.processedAt)
    .map((req) => {
      const from = new Date(req.requestedAt.replace(" ", "T"));
      const to = new Date(req.processedAt.replace(" ", "T"));
      return (to - from) / 1000 / 60; // 분
    })
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

  if (spans.length === 0) return "-";

  const avgMinutes = spans.reduce((sum, m) => sum + m, 0) / spans.length;

  if (avgMinutes < 60) return `${Math.round(avgMinutes)}분`;
  return `${(avgMinutes / 60).toFixed(1)}시간`;
}

function IntegrationRequestManagement() {
  const navigate = useNavigate();

  // 탭이 바뀌어도 KPI는 전체 기준이어야 해서, 목록은 항상 전체를 받아 화면에서 거른다.
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("대기중");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 승인/거절 처리 중인 요청 번호 (버튼 중복 클릭 방지)
  const [busyId, setBusyId] = useState(null);
  // 후보 환자가 둘 이상일 때 누구와 연결할지 고르는 창
  const [picking, setPicking] = useState(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setRequests(await fetchLinkRequests());
    } catch (e) {
      setError(errorMessage(e, "연동 요청을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRequests = useMemo(
    () => (activeTab === "전체" ? requests : requests.filter((item) => item.status === activeTab)),
    [requests, activeTab]
  );

  const kpis = useMemo(() => {
    const pending = requests.filter((r) => r.status === "대기중").length;
    const approvedThisWeek = requests.filter(
      (r) => r.status === "승인됨" && isThisWeek(r.processedAt)
    ).length;

    return [
      { label: "대기중 요청", value: pending, color: "#E8A13B", bg: "#FFFFFF" },
      { label: "이번주 승인", value: approvedThisWeek, color: "#2FA35C", bg: "#FFFFFF" },
      { label: "평균 처리 시간", value: averageHandlingTime(requests), color: "#1E2A3A", bg: "#FFFFFF" },
    ];
  }, [requests]);

  const runDecision = async (action) => {
    try {
      await action();
      await load();
    } catch (e) {
      setError(errorMessage(e, "처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setBusyId(null);
      setPicking(null);
    }
  };

  // 승인. 후보가 한 명이면 바로, 여러 명이면 누구인지 먼저 고른다.
  const handleApprove = (req) => {
    if (req.candidates.length === 0) return;
    if (req.candidates.length > 1) {
      setPicking(req);
      return;
    }
    setBusyId(req.id);
    runDecision(() => approveLinkRequest(req.id, req.candidates[0].patientId));
  };

  const handleReject = (req) => {
    setBusyId(req.id);
    runDecision(() => rejectLinkRequest(req.id));
  };

  return (
    <div className="integration-request-management flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="integration" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#1E2A3A]">환자 연동 요청 관리</h1>
            <p className="text-sm text-[#5A6B80]">보호자·환자 앱에서 접수된 연동 요청을 확인하고 승인하세요</p>
          </div>

          {error && (
            <p className="rounded-lg border border-[#E0442E] bg-[#FDEDEA] px-4 py-3 text-sm font-semibold text-[#E0442E]">
              {error}
            </p>
          )}

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
            {kpis.map((kpi) => (
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
                  {["요청자", "연락처", "환자이름", "환자 생년월일", "매칭 환자", "요청일시", "상태", "관리"].map((heading) => (
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
                    <td className="px-4 text-xs">
                      {req.status !== "대기중" ? (
                        <span className="text-[#5A6B80]">–</span>
                      ) : req.candidates.length === 0 ? (
                        <span className="font-semibold text-[#E0442E]">일치하는 환자 없음</span>
                      ) : req.candidates.length === 1 ? (
                        <span className="text-[#1E2A3A]">
                          {req.candidates[0].ward} {req.candidates[0].roomNum}호
                        </span>
                      ) : (
                        <span className="font-semibold text-[#E8A13B]">{req.candidates.length}명 — 선택 필요</span>
                      )}
                    </td>
                    <td className="px-4 font-mono text-xs text-[#5A6B80]">{req.requestedAt}</td>
                    <td className="px-4">
                      <StatusBadge severity={STATUS_STYLE[req.status].severity} label={req.status} />
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        {req.status === "대기중" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              disabled={busyId === req.id || req.candidates.length === 0}
                              title={
                                req.candidates.length === 0
                                  ? "신청한 이름·생년월일과 맞는 환자가 우리 병원에 없습니다"
                                  : undefined
                              }
                              className="flex items-center gap-1 rounded-lg bg-[#2FA35C] px-3 py-[6px] text-xs font-bold text-white disabled:opacity-40"
                            >
                              <Icon name="check" size={13} className="text-white" />
                              승인
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(req)}
                              disabled={busyId === req.id}
                              className="flex items-center gap-1 rounded-lg border border-[#E0442E] bg-white px-3 py-[6px] text-xs font-bold text-[#E0442E] disabled:opacity-40"
                            >
                              <Icon name="x" size={13} className="text-[#E0442E]" />
                              거절
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/integration-requests/${req.id}`)}
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
                      {loading ? "불러오는 중…" : "해당 상태의 연동 요청이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* 동명이인이 있을 때: 어느 환자와 연결할지 고른다 */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3A]/50 p-6">
          <div role="dialog" aria-modal="true" className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-lg">
            <p className="text-lg font-bold text-[#1E2A3A]">어느 환자와 연결할까요?</p>
            <p className="mt-1 text-sm text-[#5A6B80]">
              {picking.patientName} ({picking.birthDate}) 이름과 생년월일이 같은 환자가
              {" "}{picking.candidates.length}명 있습니다.
            </p>

            <ul className="mt-4 flex flex-col gap-2">
              {picking.candidates.map((candidate) => (
                <li key={candidate.patientId}>
                  <button
                    type="button"
                    onClick={() => {
                      setBusyId(picking.id);
                      runDecision(() => approveLinkRequest(picking.id, candidate.patientId));
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#DCE3EC] px-4 py-3 text-left hover:border-[#2B6FE3]"
                  >
                    <span className="text-sm font-bold text-[#1E2A3A]">{candidate.name}</span>
                    <span className="font-mono text-xs text-[#5A6B80]">
                      {candidate.patientNo} · {candidate.ward} {candidate.roomNum}호 {candidate.bedNum}번
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setPicking(null)}
              className="mt-4 h-11 w-full rounded-lg border border-[#DCE3EC] text-sm font-semibold text-[#5A6B80]"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationRequestManagement;
