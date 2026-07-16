import { getPasswordStrength, PASSWORD_HINT } from "../../utils/password-strength.js";

const LEVEL_STYLE = {
  weak: { color: "#E0442E", width: "33%" },
  medium: { color: "#E8A13B", width: "66%" },
  strong: { color: "#2FA35C", width: "100%" },
};

function PasswordStrengthMeter({ password }) {
  const { level, label } = getPasswordStrength(password);

  if (level === "none") {
    return <p className="password-strength-meter__hint text-[11px] text-[#5A6B80]">{PASSWORD_HINT}</p>;
  }

  const style = LEVEL_STYLE[level];

  return (
    <div className="password-strength-meter flex flex-col gap-[5px]">
      <div className="password-strength-meter__track h-[4px] w-full overflow-hidden rounded-full bg-[#EDF1F6]">
        <div
          className="password-strength-meter__fill h-full rounded-full transition-all"
          style={{ width: style.width, backgroundColor: style.color }}
        />
      </div>
      <p className="password-strength-meter__label text-[11px] font-semibold" style={{ color: style.color }}>
        비밀번호 강도: {label} {level !== "strong" && `· ${PASSWORD_HINT}`}
      </p>
    </div>
  );
}

export default PasswordStrengthMeter;
