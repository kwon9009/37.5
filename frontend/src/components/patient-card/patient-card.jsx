import PresenceBadge from "../presence-badge/presence-badge.jsx";
import StatusBadge from "../status-badge/status-badge.jsx";
import SpecialNoteTag from "../special-note-tag/special-note-tag.jsx";
import Icon from "../icon/icon.jsx";

const SEVERITY_COLOR = {
  normal: "#2FA35C",
  caution: "#E8A13B",
  warning: "#E8762B",
  emergency: "#E0442E",
};

const SENSOR_COLOR = {
  연결됨: "#2FA35C",
  "신호 약함": "#E8A13B",
  "신호 이상": "#E0442E",
};

// 심박수 스파크라인 배경 구간. 백엔드 NEWS2 판정 기본 경계(vital_service.py의
// judge_status 기본값: danger 40/131, WARNING 41~50·91~110, ALERT 111~130)와
// 맞춘 것 - 병원이 danger 경계를 설정에서 바꿔도 이 미니 그래프까지 실시간으로
// 반영하진 않는다(카드 하나에 그정도 정밀도는 과함). 정상 대비 지금 값이
// "대충 어느 구간"에 있는지 한눈에 보여주는 용도.
const HR_DOMAIN = [30, 170];
const HR_BANDS = [
  { from: 30, to: 40, color: "#E0442E" }, // <=40 danger
  { from: 40, to: 50, color: "#E8A13B" }, // 41~50 caution
  { from: 50, to: 90, color: "#2FA35C" }, // 51~90 normal
  { from: 90, to: 110, color: "#E8A13B" }, // 91~110 caution
  { from: 110, to: 130, color: "#E8762B" }, // 111~130 warning
  { from: 130, to: 170, color: "#E0442E" }, // >=131 danger
];

function HeartRateSparkline({ history = [], color }) {
  const width = 120;
  const height = 32;
  const [domainMin, domainMax] = HR_DOMAIN;

  const valueToY = (value) => {
    const clamped = Math.min(domainMax, Math.max(domainMin, value));
    return height - ((clamped - domainMin) / (domainMax - domainMin)) * height;
  };

  const points = history.map((value, index) => [
    history.length > 1 ? (index / (history.length - 1)) * width : width / 2,
    valueToY(value),
  ]);
  const linePath = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const lastPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="30" preserveAspectRatio="none">
      {HR_BANDS.map((band) => (
        <rect
          key={band.from}
          x="0"
          y={valueToY(band.to)}
          width={width}
          height={Math.max(0, valueToY(band.from) - valueToY(band.to))}
          fill={band.color}
          fillOpacity="0.12"
        />
      ))}
      {points.length > 1 && <path d={linePath} fill="none" stroke="#1E2A3A" strokeWidth="1.5" />}
      {lastPoint && <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={color} />}
    </svg>
  );
}

function PatientCard({
  name,
  room,
  severity = "normal",
  heartRate,
  respirationRate,
  sensorStatus = "연결됨",
  timestamp,
  presenceLabel = "재실중",
  notes = [],
  earlyWarning,
  heartRateHistory = [],
  onClick,
}) {
  const severityColor = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.normal;
  const sensorColor = SENSOR_COLOR[sensorStatus] ?? SEVERITY_COLOR.normal;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${name} 상세 보기` : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`patient-card flex overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)] ${
        onClick ? "cursor-pointer transition-shadow hover:shadow-[0_4px_12px_rgba(30,42,58,0.16)]" : ""
      }`}
    >
      <span className="w-[2px] shrink-0" style={{ backgroundColor: severity === "normal" ? "transparent" : severityColor }} />

      <div className="patient-card__content flex w-full flex-col gap-[14px] p-4">
        <div className="patient-card__top flex items-start justify-between">
          <div className="flex flex-col gap-[3px]">
            <p className="text-base font-bold text-[#1E2A3A]">{name}</p>
            <p className="font-mono text-xs text-[#5A6B80]">{room}</p>
            {notes.length > 0 && (
              <div className="flex gap-1 pt-[2px]">
                {notes.map((note) => (
                  <SpecialNoteTag key={note.icon + note.color} icon={note.icon} color={note.color} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PresenceBadge label={presenceLabel} />
            <StatusBadge severity={severity} />
          </div>
        </div>

        {earlyWarning && (
          <div className="flex items-center gap-[5px] rounded-md bg-[#F1EEFC] px-[9px] py-1 text-[11px] font-bold text-[#6C4FD1]">
            <Icon name="activity" size={12} className="text-[#6C4FD1]" />
            이상 패턴 조기 감지 · 확인 권장
          </div>
        )}

        <div className="patient-card__vitals flex gap-3">
          <div className="flex w-full flex-col gap-1">
            <p className="text-[11px] font-bold tracking-wide text-[#5A6B80]">심박</p>
            <div className="flex items-end gap-1">
              <span className="font-mono text-[22px] font-extrabold text-[#1E2A3A]">{heartRate}</span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">bpm</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1">
            <p className="text-[11px] font-bold tracking-wide text-[#5A6B80]">호흡</p>
            <div className="flex items-end gap-1">
              <span className="font-mono text-[22px] font-extrabold text-[#1E2A3A]">{respirationRate}</span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">회/분</span>
            </div>
          </div>
        </div>

        <div className="patient-card__sparkline h-[30px] w-full overflow-hidden">
          <HeartRateSparkline history={heartRateHistory} color={severityColor} />
        </div>

        <div className="patient-card__bottom flex items-center justify-between border-t border-[#DCE3EC] pt-2">
          <div className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: sensorColor }} />
            <span className="text-[11px] text-[#5A6B80]">{sensorStatus}</span>
          </div>
          <span className="font-mono text-[11px] text-[#5A6B80]">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}

export default PatientCard;
