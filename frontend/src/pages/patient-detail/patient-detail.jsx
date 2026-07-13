import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import PresenceBadge from "../../components/presence-badge/presence-badge.jsx";
import SpecialNoteTag from "../../components/special-note-tag/special-note-tag.jsx";

const RANGE_OPTIONS = ["1시간", "6시간", "24시간"];

const TIMELINE_ITEMS = [
  { icon: "activity", iconBg: "#FCF0DC", iconColor: "#E8A13B", message: "심박 104bpm — 주의 범위 진입", time: "방금", severity: "caution" },
  { icon: "activity", iconBg: "#FCF0DC", iconColor: "#E8A13B", message: "호흡 18회/분 — 주의 관찰 필요", time: "28분 전", severity: "caution" },
  { icon: "circle-alert", iconBg: "#FBEBDD", iconColor: "#E8762B", message: "심박 111bpm — 경고 임계 근접", time: "1시간 12분 전", severity: "warning" },
];

const EMERGENCY_EVENTS = [
  { icon: "triangle-alert", message: "급성 빈맥 발생 감지", meta: "2026.06.29 03:12 · 심박 138bpm · 호흡 27회/분" },
  { icon: "triangle-alert", message: "저산소증 의심 알림", meta: "2026.05.14 19:47 · 심박 129bpm · 호흡 9회/분" },
];

const PATIENT_INFO_ROWS = [
  ["환자명", "이영희", false],
  ["생년월일", "1959.03.12 (67세)", false],
  ["성별", "여성", false],
  ["병실·병상", "302호 · A-2", true],
  ["부착 장치", "VG-302-A2", true],
];

function TrendChart({ title, subtitle, yAxisLabels, xAxisLabels, data, min, max, lineColor = "#2B6FE3", markerIndex, markerColor }) {
  const [range, setRange] = useState("6시간");
  const width = 600;
  const height = 160;
  const step = width / (data.length - 1);
  const points = data.map((value, index) => [index * step, height - ((value - min) / (max - min)) * height]);
  const linePath = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const gridLines = [0, height / 3, (height / 3) * 2, height];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-[3px]">
          <p className="text-base font-bold text-[#1E2A3A]">{title}</p>
          <p className="text-xs text-[#5A6B80]">{subtitle}</p>
        </div>
        <div className="flex gap-[6px]">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg border px-3 py-[6px] text-xs ${
                range === option ? "border-[#2B6FE3] font-bold text-[#2B6FE3]" : "border-[#DCE3EC] text-[#5A6B80]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-[#DCE3EC]" />
      <div className="flex gap-3 p-5">
        <div className="flex h-[160px] flex-col justify-between text-right text-[11px] text-[#5A6B80]">
          {yAxisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
            {gridLines.map((y) => (
              <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#DCE3EC" strokeWidth="1" />
            ))}
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />
            {markerIndex != null && (
              <circle
                cx={points[markerIndex][0]}
                cy={points[markerIndex][1]}
                r="4"
                fill={markerColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </svg>
          <div className="flex justify-between text-[11px] text-[#5A6B80]">
            {xAxisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientDetail() {
  const { patientId } = useParams();
  const displayName = patientId ? decodeURIComponent(patientId) : "이영희";

  return (
    <div className="patient-detail flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="patients" />

      <div className="flex min-h-screen w-full flex-col">
        <Header notificationCount={2} />

        <div className="flex flex-col gap-6 p-6">
          <Link to="/patients" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">환자 목록으로</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 shrink-0 rounded-full border border-[#DCE3EC] bg-[#EDF1F6]" />
              <div className="flex flex-col gap-[5px]">
                <p className="text-2xl font-bold text-[#1E2A3A]">{displayName}</p>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5A6B80]">
                  <span>302호 · A-2</span>
                  <span>여 · 67세</span>
                  <span>담당 김간호 RN</span>
                </div>
                <div className="flex gap-[6px]">
                  {["낙상 주의", "고혈압 병력", "야간 관찰 필요"].map((tag) => (
                    <span key={tag} className="rounded-full bg-[#EDF1F6] px-[10px] py-1 text-[11px] text-[#5A6B80]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <StatusBadge severity="caution" size="lg" />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span className="h-[3px] w-full bg-[#E8A13B]" />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="heart-pulse" size={15} />
                      현재 심박
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">104</span>
                      <span className="pb-1 text-base text-[#5A6B80]">bpm</span>
                    </div>
                    <p className="text-[13px] text-[#E8A13B]">↑ 정상 범위보다 다소 높음</p>
                  </div>
                </div>

                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span className="h-[3px] w-full bg-[#2FA35C]" />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="wind" size={15} />
                      현재 호흡
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">18</span>
                      <span className="pb-1 text-base text-[#5A6B80]">회/분</span>
                    </div>
                    <p className="text-[13px] text-[#2FA35C]">정상 범위 유지</p>
                  </div>
                </div>
              </div>

              <TrendChart
                title="심박수 추이"
                subtitle="1분 평균 · vital_logs"
                yAxisLabels={[120, 100, 80, 60]}
                xAxisLabels={["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]}
                data={[88, 92, 95, 101, 108, 111, 104]}
                min={60}
                max={120}
                markerIndex={5}
                markerColor="#E8A13B"
              />

              <TrendChart
                title="호흡수 추이"
                subtitle="1분 평균 · vital_logs"
                yAxisLabels={[24, 18, 12, 6]}
                xAxisLabels={["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]}
                data={[15, 16, 17, 16, 18, 19, 18]}
                min={6}
                max={24}
              />
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">환자 정보</p>
                </div>
                <div className="flex flex-col gap-[10px] p-[17px]">
                  {PATIENT_INFO_ROWS.map(([label, value, mono]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className={`text-[13px] font-semibold text-[#1E2A3A] ${mono ? "font-mono" : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">재실 여부</span>
                    <PresenceBadge label="재실중" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">담당 병원</span>
                    <span className="text-[13px] font-semibold text-[#1E2A3A]">우송대학교병원</span>
                  </div>
                  <span className="text-[13px] text-[#5A6B80]">특이사항</span>
                  <div className="flex gap-[6px]">
                    <SpecialNoteTag icon="triangle-alert" color="#E8A13B" label="낙상위험" showLabel />
                    <SpecialNoteTag icon="shield-alert" color="#E0442E" label="알레르기" showLabel />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">보호자</p>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCE3EC] bg-[#EDF1F6] text-base font-bold text-[#1E2A3A]">
                      박
                    </span>
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-[15px] font-bold text-[#1E2A3A]">박민수</p>
                      <p className="text-xs text-[#5A6B80]">장남 (보호자)</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#DCE3EC]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">연락처</span>
                    <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">010-2233-8871</span>
                  </div>
                  <button
                    type="button"
                    className="flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#2B6FE3] text-sm font-bold text-white"
                  >
                    <Icon name="phone" size={16} className="text-white" />
                    보호자에게 전화
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">알림 타임라인</p>
                </div>
                <div className="flex flex-col">
                  {TIMELINE_ITEMS.map((item) => (
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
                        <p className="text-[11px] text-[#5A6B80]">{item.time}</p>
                      </div>
                      <StatusBadge severity={item.severity} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">응급 이벤트</p>
                </div>
                <div className="flex flex-col">
                  {EMERGENCY_EVENTS.map((item) => (
                    <div
                      key={item.message}
                      className="flex items-center gap-3 border-b border-[#DCE3EC] px-5 py-[14px] last:border-b-0"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDEDEA]">
                        <Icon name={item.icon} size={16} style={{ color: "#E0442E" }} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">{item.message}</p>
                        <p className="truncate text-[11px] text-[#5A6B80]">{item.meta}</p>
                      </div>
                      <StatusBadge severity="normal" label="해결됨" />
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

export default PatientDetail;
