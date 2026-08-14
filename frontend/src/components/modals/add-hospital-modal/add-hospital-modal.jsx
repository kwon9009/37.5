import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";

const EMPTY_FORM = { name: "", hospital_code: "", area: "", address: "", bed_count: "", admin_id: "" };

function AddHospitalModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "add",
  initialValues,
  areaOptions = [],
  adminOptions = [],
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaults = {
      ...EMPTY_FORM,
      area: areaOptions[0] ?? "",
      admin_id: adminOptions[0]?.admin_id ?? "",
    };
    setForm(isEdit && initialValues ? { ...defaults, ...initialValues } : defaults);
    setError("");
    setSubmitting(false);
  }, [isOpen, isEdit, initialValues, areaOptions, adminOptions]);

  if (!isOpen) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("병원명을 입력해 주세요");
      return;
    }
    if (!form.hospital_code.trim()) {
      setError("병원 코드를 입력해 주세요");
      return;
    }
    if (!form.area) {
      setError("지역을 선택해 주세요");
      return;
    }
    if (!form.address.trim()) {
      setError("주소를 입력해 주세요");
      return;
    }
    if (!form.admin_id) {
      setError("담당 관리자를 선택해 주세요");
      return;
    }

    const payload = { ...form, bed_count: Number(form.bed_count) || 0, admin_id: Number(form.admin_id) };

    setSubmitting(true);
    try {
      await onSubmit?.(payload);
      onClose();
    } catch (submitError) {
      setError(submitError?.response?.data?.detail || submitError?.message || "저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
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
            {isEdit ? "병원 정보 수정" : "병원 추가"}
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

        <p className="-mt-3 text-[13px] text-[#5A6B80]">
          {isEdit ? "병원의 기본 정보를 수정하세요" : "새로 등록할 병원의 기본 정보를 입력하세요"}
        </p>

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

        <div className="flex flex-col gap-2">
          <label htmlFor="hospitalCode" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            병원 코드
          </label>
          <input
            id="hospitalCode"
            type="text"
            maxLength={10}
            value={form.hospital_code}
            onChange={(event) => updateField("hospital_code", event.target.value)}
            placeholder="예: DJ-CENTRAL01"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] placeholder:font-sans placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="hospitalAddress" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            주소
          </label>
          <input
            id="hospitalAddress"
            type="text"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="예: 대전광역시 유성구 대학로 291"
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
              value={form.area}
              onChange={(event) => updateField("area", event.target.value)}
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
            >
              {areaOptions.length === 0 && <option value="">지역 목록을 불러오는 중</option>}
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
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
              value={form.bed_count}
              onChange={(event) => updateField("bed_count", event.target.value)}
              placeholder="예: 300"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="hospitalManager" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            담당 관리자
          </label>
          <select
            id="hospitalManager"
            value={form.admin_id}
            onChange={(event) => updateField("admin_id", event.target.value)}
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
          >
            {adminOptions.length === 0 && <option value="">관리자 목록을 불러오는 중</option>}
            {adminOptions.map((admin) => (
              <option key={admin.admin_id} value={admin.admin_id}>
                {admin.name}
              </option>
            ))}
          </select>
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-[#2B6FE3] px-5 py-[10px] text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "저장 중..." : isEdit ? "저장" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddHospitalModal;
