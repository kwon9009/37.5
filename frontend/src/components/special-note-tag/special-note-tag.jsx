import Icon from "../icon/icon.jsx";

function SpecialNoteTag({ icon = "triangle-alert", color = "#E8A13B", label, showLabel = false }) {
  return (
    <span
      className={`special-note-tag flex items-center gap-[6px] rounded-full border border-[#DCE3EC] bg-[#EDF1F6] ${
        showLabel ? "px-3 py-[6px]" : "p-[5px]"
      }`}
      title={label}
    >
      <Icon name={icon} size={14} className="shrink-0" style={{ color }} />
      {showLabel && label && <span className="text-xs font-bold text-[#1E2A3A]">{label}</span>}
    </span>
  );
}

export default SpecialNoteTag;
