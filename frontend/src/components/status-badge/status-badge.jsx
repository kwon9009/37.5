const SEVERITY = {
  normal: { color: "#2FA35C", label: "정상" },
  caution: { color: "#E8A13B", label: "주의" },
  warning: { color: "#E8762B", label: "경고" },
  emergency: { color: "#E0442E", label: "응급" },
  offline: { color: "#5A6B80", label: "센서없음" },
  system: { color: "#9AA7B6", label: "시스템" },
};

function StatusBadge({ severity = "normal", label, size = "sm" }) {
  const { color, label: defaultLabel } = SEVERITY[severity] ?? SEVERITY.normal;
  const sizeClasses = size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-[5px] text-xs";

  return (
    <span
      className={`status-badge flex items-center gap-[6px] rounded-full font-bold text-white ${sizeClasses}`}
      style={{ backgroundColor: color }}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-white" />
      {label ?? defaultLabel}
    </span>
  );
}

export default StatusBadge;
