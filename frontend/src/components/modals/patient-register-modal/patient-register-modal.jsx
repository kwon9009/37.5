import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";
import SpecialNoteChips from "../../special-note-chips/special-note-chips.jsx";
import { composeSpecialNotes } from "../../../lib/special-notes.js";

const WARD_OPTIONS = ["3병동", "4병동", "5병동", "6병동", "중환자실"];

const INITIAL_FORM = {
  name: "",
  gender: "남",
  birthDate: "",
  ward: "",
  room: "",
  bed: "",
  guardianPhone: "",
  otherNotes: "",
};

function PatientRegisterModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedNotes, setSelectedNotes] = useState(["allergy"]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setSelectedNotes(["allergy"]);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleNote = (key) => {
    setSelectedNotes((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("환자 이름을 입력해 주세요");
      return;
    }
    if (!form.birthDate.trim()) {
      setError("생년월일을 입력해 주세요");
      return;
    }
    if (!form.ward) {
      setError("병동을 선택해 주세요");
      return;
    }
    if (!form.room.trim() || !form.bed.trim()) {
      setError("병실과 병상을 숫자로 입력해 주세요");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        ...form,
        notes: selectedNotes,
        special_notes: composeSpecialNotes(selectedNotes, form.otherNotes),
      });
      onClose();
    } catch (err) {
      setError(err?.message || "환자 등록 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="patient-register-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patientRegisterTitle"
        className="flex max-h-[90vh] w-[520px] max-w-full flex-col gap-[10px] overflow-y-auto rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="patientRegisterTitle" className="text-xl font-bold text-[#1E2A3A]">
            환자 등록
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

        <p className="text-[13px] text-[#5A6B80]">새로운 환자의 기본 정보를 입력하세요</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="patientName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            이름
          </label>
          <input
            id="patientName"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="환자 이름 입력"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wide text-[#5A6B80]">성별</span>
          <div className="flex gap-1 rounded-lg bg-[#EDF1F6] p-1">
            {["남", "여"].map((option) => {
              const isActive = form.gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("gender", option)}
                  className={`h-9 w-full rounded-md text-[13px] ${isActive ? "bg-[#2B6FE3] font-bold text-white" : "font-semibold text-[#5A6B80]"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="patientBirthDate" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            생년월일
          </label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
            <Icon name="calendar" size={15} className="shrink-0 text-[#5A6B80]" />
            <input
              id="patientBirthDate"
              type="text"
              value={form.birthDate}
              onChange={(event) => updateField("birthDate", event.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full border-0 bg-transparent text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="patientWard" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            병동
          </label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px]">
            <select
              id="patientWard"
              value={form.ward}
              onChange={(event) => updateField("ward", event.target.value)}
              className="w-full appearance-none bg-transparent text-sm text-[#1E2A3A] focus:outline-none"
            >
              <option value="" disabled>
                병동 선택
              </option>
              {WARD_OPTIONS.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={15} className="shrink-0 text-[#5A6B80]" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="patientRoom" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              병실
            </label>
            <input
              id="patientRoom"
              type="number"
              min="0"
              value={form.room}
              onChange={(event) => updateField("room", event.target.value)}
              placeholder="예: 302"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="patientBed" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              병상
            </label>
            <input
              id="patientBed"
              type="number"
              min="0"
              value={form.bed}
              onChange={(event) => updateField("bed", event.target.value)}
              placeholder="예: 2"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="patientGuardianPhone" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            보호자 연락처
          </label>
          <input
            id="patientGuardianPhone"
            type="text"
            value={form.guardianPhone}
            onChange={(event) => updateField("guardianPhone", event.target.value)}
            placeholder="010-0000-0000"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] placeholder:font-sans placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wide text-[#5A6B80]">특이사항</span>
          <SpecialNoteChips selectedKeys={selectedNotes} onToggle={toggleNote} />
          <input
            type="text"
            value={form.otherNotes}
            onChange={(event) => updateField("otherNotes", event.target.value)}
            placeholder="위 항목에 없는 내용은 직접 입력하세요"
            className="h-10 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-[13px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        {error && <p className="text-xs font-semibold text-[#E0442E]">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-[#DCE3EC] pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#DCE3EC] bg-white px-5 py-[10px] text-sm font-semibold text-[#1E2A3A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-[#2B6FE3] px-5 py-[10px] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientRegisterModal;
