import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import FallAssessModal from "../../components/modals/fall-assess-modal/fall-assess-modal.jsx";

const KPIS = [
  { label: "낙상위험 환자", value: 34, color: "#1E2A3A", bg: "#FFFFFF" },
  { label: "고위험군", value: 8, color: "#E0442E", bg: "#FDEDEA" },
  { label: "이번달 낙상 발생", value: 3, color: "#E8762B", bg: "#FFFFFF" },
  { label: "예방조치 완료율", value: "82%", color: "#2FA35C", bg: "#FFFFFF" },
];

const RISK_ROWS = [
  { name: "김영자", ward: "3병동", room: "302호", risk: "emergency", riskLabel: "고위험", nurse: "박수진", lastAssessed: "2026-07-05", prevention: "침대난간 설치, 미끄럼방지매트" },
  { name: "이철수", ward: "4병동", room: "411호", risk: "caution", riskLabel: "중위험", nurse: "김하늘", lastAssessed: "2026-07-06", prevention: "야간 순회 강화" },
  { name: "박정숙", ward: "중환자실", room: "ICU-2", risk: "emergency", riskLabel: "고위험", nurse: "이도현", lastAssessed: "2026-07-07", prevention: "이동시 보조 필요, 낙상벨 비치" },
  { name: "최민호", ward: "3병동", room: "305호", risk: "normal", riskLabel: "저위험", nurse: "박수진", lastAssessed: "2026-07-03", prevention: "정기 모니터링" },
  { name: "한서연", ward: "4병동", room: "418호", risk: "caution", riskLabel: "중위험", nurse: "정유진", lastAssessed: "2026-07-06", prevention: "미끄럼방지매트 비치" },
  { name: "오지훈", ward: "중환자실", room: "ICU-5", risk: "emergency", riskLabel: "고위험", nurse: "이도현", lastAssessed: "2026-07-08", prevention: "24시간 관찰, 억제대 고려" },
  { name: "강수정", ward: "3병동", room: "309호", risk: "normal", riskLabel: "저위험", nurse: "김하늘", lastAssessed: "2026-07-02", prevention: "정기 모니터링" },
  { name: "윤태영", ward: "4병동", room: "422호", risk: "caution", riskLabel: "중위험", nurse: "정유진", lastAssessed: "2026-07-05", prevention: "보행 보조기 사용 안내" },
];

const FALL_EVENTS = [
  { name: "김철수", detail: "305호 화장실 낙상", time: "07-08 09:12", severity: "warning", label: "중등도" },
  { name: "최지우", detail: "308호 침대 낙상", time: "07-07 22:47", severity: "caution", label: "경미" },
  { name: "오지호", detail: "311호 복도 낙상", time: "07-06 15:30", severity: "emergency", label: "심각" },
  { name: "한서연", detail: "308호 침대 낙상", time: "07-05 03:18", severity: "caution", label: "경미" },
  { name: "김도윤", detail: "311호 화장실 낙상", time: "07-02 11:05", severity: "warning", label: "중등도" },
];

const EVENT_ICON_STYLE = {
  emergency: { bg: "#FDEDEA", color: "#E0442E" },
  warning: { bg: "#FBEBDD", color: "#E8762B" },
  caution: { bg: "#FCF0DC", color: "#E8A13B" },
};

const RISK_CRITERIA = [
  { label: "고위험", color: "#E0442E", range: "Morse Fall Scale 45점 이상", desc: "즉시 예방조치 및 1:1 관찰 필요" },
  { label: "중위험", color: "#E8762B", range: "Morse Fall Scale 25~44점", desc: "정기 모니터링 및 낙상 예방 매트 적용" },
  { label: "저위험", color: "#2FA35C", range: "Morse Fall Scale 24점 이하", desc: "표준 관찰 및 안전 교육 제공" },
];

function FallManagement() {
  const navigate = useNavigate();
  const [isAssessOpen, setIsAssessOpen] = useState(false);

  return (
    <div className="fall-management flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="falls" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">낙상 관리</h1>
              <p className="text-sm text-[#5A6B80]">낙상 위험 환자 모니터링 및 낙상 이벤트 기록 관리</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssessOpen(true)}
              className="flex items-center gap-[6px] rounded-lg bg-[#2B6FE3] px-4 py-[10px] text-sm font-bold text-white"
            >
              <Icon name="plus" size={16} className="text-white" />
              낙상 위험도 평가 등록
            </button>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                <h2 className="text-lg font-bold text-[#1E2A3A]">낙상위험 환자 목록</h2>
                <p className="text-[13px] text-[#5A6B80]">총 {RISK_ROWS.length}명</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[84px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[106px]" />
                    <col className="w-[70px]" />
                    <col className="w-[100px]" />
                    <col />
                    <col className="w-[58px]" />
                  </colgroup>
                  <thead>
                    <tr className="h-12 bg-[#EDF1F6]">
                      {["환자명", "병동", "병실", "낙상위험도", "간호사", "최근평가일", "예방조치", "상세"].map((heading) => (
                        <th key={heading} scope="col" className="px-[10px] text-xs font-bold tracking-wide text-[#5A6B80]">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RISK_ROWS.map((row) => (
                      <tr key={row.name} className="h-16 border-t border-[#DCE3EC]">
                        <td className="px-[10px] text-[15px] font-semibold text-[#1E2A3A]">{row.name}</td>
                        <td className="px-[10px] text-sm text-[#1E2A3A]">{row.ward}</td>
                        <td className="px-[10px] text-sm text-[#1E2A3A]">{row.room}</td>
                        <td className="px-[10px]">
                          <StatusBadge severity={row.risk} label={row.riskLabel} />
                        </td>
                        <td className="px-[10px] text-sm text-[#1E2A3A]">{row.nurse}</td>
                        <td className="px-[10px] text-xs text-[#5A6B80]">{row.lastAssessed}</td>
                        <td className="px-[10px] py-2 text-xs leading-snug text-[#5A6B80]">{row.prevention}</td>
                        <td className="px-[10px]">
                          <button
                            type="button"
                            aria-label={`${row.name} 상세 보기`}
                            onClick={() => navigate(`/patients/${encodeURIComponent(row.name)}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B6FE3]"
                          >
                            <Icon name="chevron-right" size={14} className="text-white" />
                          </button>
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
                  <p className="text-base font-bold text-[#1E2A3A]">낙상 이벤트 기록</p>
                  <p className="text-xs text-[#5A6B80]">최근 7일간 발생 이력</p>
                </div>
                <div className="flex flex-col">
                  {FALL_EVENTS.map((event) => {
                    const iconStyle = EVENT_ICON_STYLE[event.severity];
                    return (
                      <button
                        key={event.name + event.time}
                        type="button"
                        onClick={() => navigate(`/falls/${encodeURIComponent(event.name)}`)}
                        className="flex w-full items-center gap-3 border-b border-[#DCE3EC] px-5 py-[14px] text-left last:border-b-0 hover:bg-[#F5F7FA]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: iconStyle.bg }}
                        >
                          <Icon name="footprints" size={16} style={{ color: iconStyle.color }} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">
                            {event.name} · {event.detail}
                          </p>
                          <p className="font-mono text-[11px] text-[#5A6B80]">{event.time}</p>
                        </div>
                        <StatusBadge severity={event.severity} label={event.label} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">낙상 위험도 평가 기준</p>
                </div>
                <div className="flex flex-col gap-[14px] p-4">
                  {RISK_CRITERIA.map((item) => (
                    <div key={item.label} className="flex gap-[10px]">
                      <span className="mt-[5px] h-[10px] w-[10px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex w-full flex-col gap-[2px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[#1E2A3A]">{item.label}</span>
                          <span className="text-[11px] font-semibold text-[#5A6B80]">{item.range}</span>
                        </div>
                        <p className="text-xs text-[#5A6B80]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FallAssessModal isOpen={isAssessOpen} onClose={() => setIsAssessOpen(false)} />
    </div>
  );
}

export default FallManagement;
