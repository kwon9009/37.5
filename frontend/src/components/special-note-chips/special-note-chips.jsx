import Icon from "../icon/icon.jsx";
import { SPECIAL_NOTE_OPTIONS } from "../../lib/special-notes.js";

function SpecialNoteChips({ selectedKeys, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPECIAL_NOTE_OPTIONS.map((chip) => {
        const isActive = selectedKeys.includes(chip.key);
        const activeColor = chip.critical ? "#E0442E" : "#2B6FE3";
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onToggle(chip.key)}
            className="flex items-center gap-[6px] rounded-full border px-3 py-[6px] text-xs font-bold"
            style={
              isActive
                ? { borderColor: activeColor, backgroundColor: activeColor, color: "#FFFFFF" }
                : { borderColor: "#DCE3EC", backgroundColor: "#EDF1F6", color: "#1E2A3A" }
            }
          >
            <Icon name={chip.icon} size={14} className={isActive ? "text-white" : "text-[#5A6B80]"} />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export default SpecialNoteChips;
