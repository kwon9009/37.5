function PresenceBadge({ label = "재실중", present = true, color }) {
  const dotColor = color ?? (present ? "#2FA35C" : "#8B9AAE");

  return (
    <span className="presence-badge flex items-center gap-[6px] rounded-full border border-[#DCE3EC] bg-[#EDF1F6] px-[10px] py-[5px] text-xs font-bold text-[#1E2A3A]">
      <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  );
}

export default PresenceBadge;
