import PresenceBadge from "../presence-badge/presence-badge.jsx";
import StatusBadge from "../status-badge/status-badge.jsx";
import SpecialNoteTag from "../special-note-tag/special-note-tag.jsx";

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
          <svg viewBox="0 0 120 32" width="100%" height="30" preserveAspectRatio="none">
            <path
              d="M0 20 L10 22 L20 12 L30 24 L40 8 L50 18 L60 10 L70 22 L80 14 L90 20 L100 6 L110 16 L120 12"
              fill="none"
              stroke={severityColor}
              strokeWidth="1.5"
            />
          </svg>
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
