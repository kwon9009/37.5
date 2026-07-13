import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import SpecialNoteTag from "../../components/special-note-tag/special-note-tag.jsx";

const TIMELINE = [
  { icon: "footprints", iconBg: "#F6DCDC", iconColor: "#E0442E", message: "낙상 감지 · AI 카메라 + 압력센서", time: "15:30:12" },
  { icon: "bell-ring", iconBg: "#FBEBDD", iconColor: "#E8762B", message: "담당 의료진 자동 알림 발송", time: "15:30:15" },
  { icon: "user-check", iconBg: "#FCF0DC", iconColor: "#E8A13B", message: "간호사 도착 · 환자 상태 확인", time: "15:31:40" },
  { icon: "phone-call", iconBg: "#DCE8FB", iconColor: "#2B6FE3", message: "정형외과 협진 요청", time: "15:35:02" },
  { icon: "circle-check", iconBg: "#DCF0E4", iconColor: "#2FA35C", message: "환자 안정 · 경과 관찰 중", time: "15:42:18" },
];

const EVENT_INFO = [
  ["발생 위치", "5병동 · 311호 앞 복도"],
  ["발생 시각", "2026-07-06 15:30:12"],
  ["감지 방식", "AI 카메라 낙상감지 + 바닥 압력센서"],
  ["지속 시간", "약 45초 (미동 감지)"],
  ["목격자", "없음 · AI 자동 감지 · 간호사 즉시 출동"],
];

function FallEmergencyDetail() {
  const { eventId } = useParams();
  const patientName = eventId ? decodeURIComponent(eventId) : "오지호";
  const [resolved, setResolved] = useState(false);
  const [timeline, setTimeline] = useState(TIMELINE);

  const handleResolve = () => {
    setResolved(true);
    setTimeline((current) => [
      ...current,
      {
        icon: "circle-check",
        iconBg: "#DCF0E4",
        iconColor: "#2FA35C",
        message: "이벤트 완료 처리됨",
        time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
      },
    ]);
  };

  return (
    <div className="fall-emergency-detail flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="falls" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={5} />

        <div className="flex flex-col gap-5 p-6">
          <Link to="/falls" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">낙상 관리로</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-[#E0442E] bg-[#FDEDEA] p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 shrink-0 rounded-full border border-[#DCE3EC] bg-white" />
              <div className="flex flex-col gap-[5px]">
                <p className="text-2xl font-bold text-[#1E2A3A]">{patientName}</p>
                <p className="font-mono text-[13px] font-semibold text-[#5A6B80]">5병동 · 311호 · A-1</p>
                <div className="flex gap-[6px]">
                  <SpecialNoteTag icon="triangle-alert" color="#E8A13B" label="낙상위험" showLabel />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge severity={resolved ? "normal" : "emergency"} label={resolved ? "해결됨" : "낙상 · 심각"} size="lg" />
              <p className="font-mono text-xs font-semibold text-[#5A6B80]">2026-07-06 15:30 발생</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="flex flex-col gap-[2px] border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">낙상 감지 카메라</p>
                  <p className="text-[13px] text-[#5A6B80]">AI가 감지한 낙상 순간의 스냅샷과 위치 정보입니다</p>
                </div>

                <div className="flex h-[360px] flex-col justify-between bg-[#151B26]">
                  <div className="flex items-center justify-between p-4">
                    <span className="flex items-center gap-[6px] rounded-md bg-black/50 px-[10px] py-[6px] font-mono text-xs font-bold text-white">
                      <Icon name="video" size={14} className="text-white" />
                      CAM 04 · 311호 복도
                    </span>
                    <span className="flex items-center gap-[6px] rounded-md bg-[#E0442E] px-[10px] py-[6px] text-xs font-bold text-white">
                      <span className="h-[6px] w-[6px] rounded-full bg-white" />
                      AI 낙상 감지
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <button
                      type="button"
                      aria-label="영상 재생"
                      className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/20"
                    >
                      <Icon name="play" size={26} className="text-white" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <span className="font-mono text-[13px] font-semibold text-white">2026-07-06 15:30:12</span>
                    <button type="button" className="flex items-center gap-1 text-[13px] font-bold text-white">
                      전체 영상 보기
                      <Icon name="chevron-right" size={14} className="text-white" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-[14px]">
                  <span className="flex items-center gap-[6px] text-xs text-[#5A6B80]">
                    <Icon name="map-pin" size={14} className="text-[#5A6B80]" />
                    촬영 위치: 5병동 311호 앞 복도 CCTV
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-[6px] rounded-lg bg-[#EDF1F6] px-3 py-2 text-xs font-semibold text-[#5A6B80]"
                  >
                    <Icon name="download" size={14} className="text-[#5A6B80]" />
                    원본 영상 다운로드
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">낙상 이벤트 정보</p>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {EVENT_INFO.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="shrink-0 text-[13px] text-[#5A6B80]">{label}</span>
                      <span className="text-right text-[13px] font-semibold text-[#1E2A3A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span className="h-[3px] w-full bg-[#E0442E]" />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="heart-pulse" size={15} />
                      이벤트 당시 심박
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">121</span>
                      <span className="pb-1 text-base text-[#5A6B80]">bpm</span>
                    </div>
                    <p className="text-[13px] text-[#E0442E]">↑ 충격으로 인한 일시적 급상승</p>
                  </div>
                </div>

                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span className="h-[3px] w-full bg-[#E8762B]" />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="wind" size={15} />
                      이벤트 당시 호흡
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">22</span>
                      <span className="pb-1 text-base text-[#5A6B80]">회/분</span>
                    </div>
                    <p className="text-[13px] text-[#E8762B]">↑ 다소 빠름, 관찰 중</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">대응 타임라인</p>
                </div>
                <div className="flex flex-col">
                  {timeline.map((item) => (
                    <div
                      key={item.message + item.time}
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

              <div className="flex flex-col gap-[10px]">
                <button
                  type="button"
                  className="flex h-[46px] items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white text-sm font-bold text-[#5A6B80]"
                >
                  <Icon name="phone-outgoing" size={16} className="text-[#5A6B80]" />
                  보호자에게 연락
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={resolved}
                  className="flex h-[46px] items-center justify-center gap-2 rounded-lg bg-[#2FA35C] text-sm font-bold text-white disabled:opacity-50"
                >
                  <Icon name="check" size={16} className="text-white" />
                  {resolved ? "완료 처리됨" : "이벤트 완료 처리"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FallEmergencyDetail;
