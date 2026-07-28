import { useEffect, useMemo, useState } from "react";
import Icon from "../../icon/icon.jsx";
import StatusBadge from "../../status-badge/status-badge.jsx";

const PATIENT_OPTIONS = ["김영자 · 3병동 · 302호", "박정호 · 3병동 · 201호", "최지우 · 3병동 · 308호", "정수빈 · 3병동 · 305호"];

const SCORE_FIELDS = [
  {
    key: "fallHistory",
    label: "낙상 경험 (최근 3개월 내)",
    default: 25,
    options: [
      { value: 0, label: "없음" },
      { value: 25, label: "있음" },
    ],
  },
  {
    key: "secondaryDiagnosis",
    label: "이차 진단명 (2개 이상)",
    default: 0,
    options: [
      { value: 0, label: "없음" },
      { value: 15, label: "있음" },
    ],
  },
  {
    key: "ambulatoryAid",
    label: "보행 보조기구",
    default: 15,
    options: [
      { value: 0, label: "없음·침상안정·간호사 도움" },
      { value: 15, label: "목발·지팡이·보행기" },
      { value: 30, label: "가구 잡고 이동" },
    ],
  },
  {
    key: "ivHeparin",
    label: "정맥주사 / 헤파린락 삽입",
    default: 20,
    options: [
      { value: 0, label: "없음" },
      { value: 20, label: "있음" },
    ],
  },
  {
    key: "gait",
    label: "보행 상태",
    default: 10,
    options: [
      { value: 0, label: "정상·침상안정·부동" },
      { value: 10, label: "허약" },
      { value: 20, label: "장애 있음" },
    ],
  },
  {
    key: "mentalStatus",
    label: "정신 상태",
    default: 0,
    options: [
      { value: 0, label: "자신의 능력 인지" },
      { value: 15, label: "능력 과대평가·잊음" },
    ],
  },
];

const PREVENTION_CHIPS = [
  { key: "rail", icon: "shield-check", label: "침대난간 설치" },
  { key: "mat", icon: "layers", label: "미끄럼방지매트" },
  { key: "watch", icon: "eye", label: "1:1 관찰" },
  { key: "aid", icon: "accessibility", label: "보행보조기구 제공" },
  { key: "education", icon: "graduation-cap", label: "낙상예방교육" },
  { key: "lighting", icon: "lightbulb", label: "야간조명 강화" },
];

const DEFAULT_SCORES = Object.fromEntries(SCORE_FIELDS.map((field) => [field.key, field.default]));

function riskFromTotal(total) {
  if (total >= 45) return { severity: "emergency", label: "고위험" };
  if (total >= 25) return { severity: "caution", label: "중위험" };
  return { severity: "normal", label: "저위험" };
}

function FallAssessModal({ isOpen, onClose, onSubmit }) {
  const [patient, setPatient] = useState(PATIENT_OPTIONS[0]);
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [selectedChips, setSelectedChips] = useState(["rail", "mat", "watch"]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPatient(PATIENT_OPTIONS[0]);
      setScores(DEFAULT_SCORES);
      setSelectedChips(["rail", "mat", "watch"]);
      setMemo("");
    }
  }, [isOpen]);

  const total = useMemo(() => Object.values(scores).reduce((sum, value) => sum + value, 0), [scores]);
  const risk = riskFromTotal(total);

  if (!isOpen) return null;

  const toggleChip = (key) => {
    setSelectedChips((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const handleSubmit = () => {
    onSubmit?.({ patient, total, risk: risk.label, preventions: selectedChips, memo });
    onClose();
  };

  return (
    <div
      className="fall-assess-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fallAssessTitle"
        className="flex max-h-[90vh] w-[600px] max-w-full flex-col gap-[10px] overflow-y-auto rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="fallAssessTitle" className="text-xl font-bold text-[#1E2A3A]">
            낙상 위험도 평가 등록
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF1F6] text-[#5A6B80] hover:bg-[#DCE3EC]"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <p className="text-[13px] text-[#5A6B80]">환자의 낙상 위험도를 평가하고 예방 조치를 등록하세요</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="fallAssessPatient" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            환자 선택
          </label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
            <Icon name="user" size={15} className="shrink-0 text-[#5A6B80]" />
            <select
              id="fallAssessPatient"
              value={patient}
              onChange={(event) => setPatient(event.target.value)}
              className="w-full appearance-none bg-transparent text-sm font-semibold text-[#1E2A3A] focus:outline-none"
            >
              {PATIENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={15} className="shrink-0 text-[#5A6B80]" />
          </div>
        </div>

        <p className="pt-1 text-sm font-bold text-[#1E2A3A]">모스 낙상 위험도 평가 (Morse Fall Scale)</p>

        {SCORE_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-wide text-[#5A6B80]">{field.label}</span>
            <div className="flex gap-1 rounded-lg bg-[#EDF1F6] p-1">
              {field.options.map((option) => {
                const isActive = scores[field.key] === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setScores((current) => ({ ...current, [field.key]: option.value }))}
                    className={`flex h-11 w-full flex-col items-center justify-center rounded-md text-[13px] ${
                      isActive ? "bg-[#2B6FE3] font-bold text-white" : "font-semibold text-[#1E2A3A]"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className={`text-[11px] font-normal ${isActive ? "text-white" : "text-[#5A6B80]"}`}>
                      {option.value}점
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-[#DCE3EC] p-4" style={{ backgroundColor: "#FDEDEA" }}>
          <div className="flex flex-col gap-[2px]">
            <span className="text-xs font-bold tracking-wide text-[#5A6B80]">총점 (Morse Fall Scale)</span>
            <div className="flex items-end gap-1">
              <span className="text-[32px] font-bold text-[#E0442E]">{total}</span>
              <span className="pb-1 text-sm font-semibold text-[#5A6B80]">점</span>
            </div>
          </div>
          <StatusBadge severity={risk.severity} label={risk.label} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wide text-[#5A6B80]">예방 조치 선택</span>
          <div className="flex flex-wrap gap-2">
            {PREVENTION_CHIPS.map((chip) => {
              const isActive = selectedChips.includes(chip.key);
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleChip(chip.key)}
                  className={`flex items-center gap-[6px] rounded-full border px-3 py-[6px] text-xs font-bold ${
                    isActive ? "border-[#2B6FE3] bg-[#2B6FE3] text-white" : "border-[#DCE3EC] bg-[#EDF1F6] text-[#1E2A3A]"
                  }`}
                >
                  <Icon name={chip.icon} size={14} className={isActive ? "text-white" : "text-[#5A6B80]"} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fallAssessMemo" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            메모
          </label>
          <textarea
            id="fallAssessMemo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="특이사항이나 추가 관찰 내용을 입력하세요"
            className="h-20 resize-none rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] p-[10px] text-[13px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[#DCE3EC] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DCE3EC] bg-white px-5 py-[10px] text-sm font-semibold text-[#1E2A3A]"
          >
            취소
          </button>
          <button type="button" onClick={handleSubmit} className="rounded-lg bg-[#2B6FE3] px-5 py-[10px] text-sm font-bold text-white">
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

export default FallAssessModal;
