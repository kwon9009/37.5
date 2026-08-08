import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import {
  approveLinkRequest,
  errorMessage,
  fetchLinkRequest,
  rejectLinkRequest,
} from "../../api/patient-link-requests.js";

/** "2026-08-08 19:46" -> "19:46" (처리 이력에는 시각만 보여준다) */
function timeOnly(dateText) {
  if (!dateText) return "";
  return dateText.split(" ")[1] ?? dateText;
}

/** 접수 -> 매칭 -> 처리 순서로 이력을 만든다 (실제 기록된 시각만 쓴다) */
function buildHistory(request) {
  const history = [
    {
      key: "received",
      icon: "send",
      iconBg: "#DCE8FB",
      iconColor: "#2B6FE3",
      message: "보호자 앱에서 연동 요청 접수",
      time: timeOnly(request.requestedAt),
    },
  ];

  if (request.status === "대기중") {
    const matched = request.candidates.length;
    history.push({
      key: "matching",
      icon: matched > 0 ? "search-check" : "x",
      iconBg: matched > 0 ? "#DCF0E4" : "#FDEDEA",
      iconColor: matched > 0 ? "#2FA35C" : "#E0442E",
      message:
        matched === 0
          ? "이름·생년월일이 맞는 환자를 찾지 못했습니다"
          : `환자 매칭 ${matched}명 확인`,
      time: "-",
    });
    history.push({
      key: "waiting",
      icon: "clock-3",
      iconBg: "#FBEBDD",
      iconColor: "#E8A13B",
      message: "담당자 검토 대기 중",
      time: "대기중",
    });
    return history;
  }

  const approved = request.status === "승인됨";
  history.push({
    key: "decided",
    icon: approved ? "check" : "x",
    iconBg: approved ? "#DCF0E4" : "#FDEDEA",
    iconColor: approved ? "#2FA35C" : "#E0442E",
    message: approved
      ? "담당자가 연동 요청을 승인했습니다"
      : "담당자가 연동 요청을 거절했습니다",
    time: timeOnly(request.processedAt),
  });

  return history;
}

function IntegrationRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 후보가 여럿일 때 어느 환자와 연결할지. 한 명이면 그 사람으로 자동 선택된다.
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // [목업] 거절 사유. patient_link_requests 테이블에 저장할 컬럼이 아직 없어서
  // 서버로 보내지 않는다. 컬럼이 생기면 rejectLinkRequest에 함께 넘기면 된다.
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const found = await fetchLinkRequest(requestId);
      setRequest(found);
      setSelectedPatientId(found.candidates.length === 1 ? found.candidates[0].patientId : null);
    } catch (e) {
      setError(errorMessage(e, "연동 요청을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const runDecision = async (action) => {
    setBusy(true);
    try {
      setError("");
      await action();
      await load();
    } catch (e) {
      setError(errorMessage(e, "처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="integration-request-detail flex min-h-screen bg-[#F5F7FA]">
        <Sidebar active="integration" />
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <p className="p-6 text-sm text-[#5A6B80]">불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="integration-request-detail flex min-h-screen bg-[#F5F7FA]">
        <Sidebar active="integration" />
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <div className="flex flex-col gap-4 p-6">
            <p className="text-sm font-semibold text-[#E0442E]">
              {error || "연동 요청을 찾을 수 없습니다."}
            </p>
            <Link to="/integration-requests" className="text-sm font-semibold text-[#2B6FE3]">
              연동 요청 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = request.status === "대기중";
  const history = buildHistory(request);
  const submittedInfo = [
    ["요청자 이름", request.requester],
    ["연락처", request.phone],
    ["환자 이름", request.patientName],
    ["환자 생년월일", request.birthDate],
    ["환자와의 관계", request.relation],
  ];

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

          {error && (
            <p className="rounded-lg border border-[#E0442E] bg-[#FDEDEA] px-4 py-3 text-sm font-semibold text-[#E0442E]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FDEDEA]">
                <Icon name="user-check" size={26} className="text-[#E8A13B]" />
              </span>
              <div className="flex flex-col gap-[5px]">
                <p className="text-[22px] font-bold text-[#1E2A3A]">{request.requester} 님의 연동 요청</p>
                <p className="font-mono text-xs font-semibold text-[#5A6B80]">요청번호 REQ-{request.id}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge
                severity={isPending ? "caution" : request.status === "승인됨" ? "normal" : "offline"}
                label={request.status}
                size="lg"
              />
              <p className="font-mono text-xs font-semibold text-[#5A6B80]">{request.requestedAt} 접수</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">요청자 제출 정보</p>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {submittedInfo.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className="font-mono text-sm font-bold text-[#1E2A3A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 시스템 매칭 결과: 신청한 이름·생년월일과 맞는 우리 병원 환자 */}
              <div
                className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]"
                style={{ borderColor: request.candidates.length > 0 ? "#2FA35C" : "#DCE3EC" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">시스템 매칭 결과</p>
                  {isPending && (
                    <span
                      className="flex items-center gap-[5px] rounded-full px-[10px] py-[5px] text-xs font-bold text-white"
                      style={{ backgroundColor: request.candidates.length > 0 ? "#2FA35C" : "#E0442E" }}
                    >
                      <Icon
                        name={request.candidates.length > 0 ? "check" : "x"}
                        size={13}
                        className="text-white"
                      />
                      {request.candidates.length > 0
                        ? `일치하는 환자 ${request.candidates.length}명`
                        : "일치하는 환자 없음"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-[10px] p-5">
                  {!isPending ? (
                    <p className="text-sm text-[#5A6B80]">
                      이미 처리된 요청이라 매칭 결과를 다시 조회하지 않습니다.
                    </p>
                  ) : request.candidates.length === 0 ? (
                    <p className="text-sm text-[#5A6B80]">
                      신청한 이름({request.patientName})과 생년월일({request.birthDate})에 맞는 환자가
                      우리 병원에 없습니다. 요청자에게 확인이 필요합니다.
                    </p>
                  ) : (
                    request.candidates.map((candidate) => {
                      const selected = selectedPatientId === candidate.patientId;
                      return (
                        <label
                          key={candidate.patientId}
                          className="flex cursor-pointer items-center gap-[14px] rounded-[10px] border p-[14px]"
                          style={{
                            borderColor: selected ? "#2B6FE3" : "#DCE3EC",
                            backgroundColor: selected ? "#F3F7FE" : "#EDF1F6",
                          }}
                        >
                          <input
                            type="radio"
                            name="candidate"
                            className="h-4 w-4 shrink-0"
                            checked={selected}
                            onChange={() => setSelectedPatientId(candidate.patientId)}
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-[15px] font-bold text-[#1E2A3A]">
                              {candidate.name} <span className="font-mono text-xs text-[#5A6B80]">{candidate.birthDate}</span>
                            </p>
                            <p className="text-xs text-[#5A6B80]">
                              {candidate.patientNo} · {candidate.ward} · {candidate.roomNum}호 · {candidate.bedNum}번
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/patients/${candidate.patientId}`);
                            }}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs font-semibold text-[#5A6B80]"
                          >
                            환자 상세보기
                            <Icon name="chevron-right" size={13} />
                          </button>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">요청 처리</p>
                </div>
                <div className="flex flex-col gap-[14px] p-5">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={busy || selectedPatientId === null}
                        onClick={() => runDecision(() => approveLinkRequest(request.id, selectedPatientId))}
                        title={
                          selectedPatientId === null
                            ? "연결할 환자를 먼저 선택해 주세요"
                            : undefined
                        }
                        className="flex h-[46px] items-center justify-center gap-2 rounded-lg bg-[#2FA35C] text-sm font-bold text-white disabled:opacity-40"
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
                        {/* DB에 저장할 컬럼이 아직 없어서 서버로 전달되지 않는다.
                            적은 내용이 사라지는 것을 담당자가 모르면 안 되므로 그대로 알린다. */}
                        <p className="text-[11px] text-[#E8A13B]">
                          사유는 아직 저장되지 않습니다 (DB 컬럼 준비 중)
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runDecision(() => rejectLinkRequest(request.id))}
                        className="flex h-[46px] items-center justify-center gap-2 rounded-lg border border-[#E0442E] bg-white text-sm font-bold text-[#E0442E] disabled:opacity-40"
                      >
                        <Icon name="x" size={16} className="text-[#E0442E]" />
                        연동 거절
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-[#5A6B80]">
                      이 요청은 이미 <span className="font-bold text-[#1E2A3A]">{request.status}</span> 처리되었습니다.
                      {request.processedAt && (
                        <span className="mt-1 block font-mono text-xs">{request.processedAt}</span>
                      )}
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
                      key={item.key}
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
