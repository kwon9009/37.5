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

/**
 * 값 배열을 꺾은선 path 로 바꾼다. 곡선 보간을 쓰지 않고 점을 직선으로 잇는다
 * (생체신호는 매끈한 곡선보다 뾰족한 꺾은선이 실제에 가깝다).
 * 세로는 배열 안의 최소~최대에 맞춰 늘려서, 값이 좁게 움직여도 파형이 보이게 한다.
 */
function sparklinePath(series) {
  // 값이 없으면 아무것도 그리지 않는다. 예전에는 고정된 지그재그를 그려서
  // 측정을 안 하는 환자도 파형이 있는 것처럼 보였다.
  if (!Array.isArray(series) || series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const stepX = 120 / (series.length - 1);
  return series
    .map((value, index) => {
      const x = Math.round(index * stepX * 10) / 10;
      // 위아래 4px 여백을 남겨 선이 카드 경계에 붙지 않게 한다
      const y = Math.round((28 - ((value - min) / span) * 24) * 10) / 10;
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function PatientCard({
  name,
  room,
  severity = "normal",
  heartRate,
  respirationRate,
  sensorStatus = "연결됨",
  presenceLabel = "재실중",
  notes = [],
  earlyWarning,
  series,
  onClick,
}) {
  const severityColor = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.normal;
  const sensorColor = SENSOR_COLOR[sensorStatus] ?? SEVERITY_COLOR.normal;
  const sparkPath = sparklinePath(series);

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
              <span className="font-mono text-[22px] font-extrabold text-[#1E2A3A]">{heartRate ?? "--"}</span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">bpm</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1">
            <p className="text-[11px] font-bold tracking-wide text-[#5A6B80]">호흡</p>
            <div className="flex items-end gap-1">
              <span className="font-mono text-[22px] font-extrabold text-[#1E2A3A]">{respirationRate ?? "--"}</span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">회/분</span>
            </div>
          </div>
        </div>

        <div className="patient-card__sparkline h-[30px] w-full overflow-hidden">
          <svg viewBox="0 0 120 32" width="100%" height="30" preserveAspectRatio="none">
            {sparkPath ? (
              <path d={sparkPath} fill="none" stroke={severityColor} strokeWidth="1.5" />
            ) : (
              <line x1="0" y1="16" x2="120" y2="16" stroke="#DCE3EC" strokeWidth="1" strokeDasharray="3 3" />
            )}
          </svg>
        </div>

        {/* 측정 시각은 화면 오른쪽 위에 이미 크게 떠 있어 카드마다 반복하지 않는다 */}
        <div className="patient-card__bottom flex items-center gap-[6px] border-t border-[#DCE3EC] pt-2">
          <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: sensorColor }} />
          <span className="text-[11px] text-[#5A6B80]">{sensorStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default PatientCard;
