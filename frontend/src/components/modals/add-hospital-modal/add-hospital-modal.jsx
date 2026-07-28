import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";

const REGION_OPTIONS = ["수도권", "영남권", "호남권", "충청권", "강원권", "제주권"];

const INITIAL_FORM = { name: "", region: REGION_OPTIONS[0], beds: "", manager: "" };

function AddHospitalModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("병원명을 입력해 주세요");
      return;
    }
    onSubmit?.({ ...form, beds: Number(form.beds) || 0 });
    onClose();
  };

  return (
    <div
      className="add-hospital-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="addHospitalTitle"
        className="flex w-[440px] max-w-full flex-col gap-5 rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="addHospitalTitle" className="text-xl font-bold text-[#1E2A3A]">
            병원 추가
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

        <p className="-mt-3 text-[13px] text-[#5A6B80]">새로 등록할 병원의 기본 정보를 입력하세요</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="hospitalName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            병원명
          </label>
          <input
            id="hospitalName"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="예: 대전세종병원"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="hospitalRegion" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              지역
            </label>
            <select
              id="hospitalRegion"
              value={form.region}
              onChange={(event) => updateField("region", event.target.value)}
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
            >
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="hospitalBeds" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              총 병상 수
            </label>
            <input
              id="hospitalBeds"
              type="number"
              min="0"
              value={form.beds}
              onChange={(event) => updateField("beds", event.target.value)}
              placeholder="예: 300"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="hospitalManager" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            담당 관리자
          </label>
          <input
            id="hospitalManager"
            type="text"
            value={form.manager}
            onChange={(event) => updateField("manager", event.target.value)}
            placeholder="담당자 이름"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        {error && <p className="text-xs font-semibold text-[#E0442E]">{error}</p>}

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

export default AddHospitalModal;
