import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";

const EMPTY_FORM = { hospital_id: "", serial_num: "" };

function AddDeviceModal({ isOpen, onClose, onSubmit, hospitalOptions = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ hospital_id: hospitalOptions[0]?.hospital_id ?? "", serial_num: "" });
    setError("");
    setSubmitting(false);
  }, [isOpen, hospitalOptions]);

  if (!isOpen) return null;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    if (!form.hospital_id) {
      setError("병원을 선택해 주세요");
      return;
    }
    if (!form.serial_num.trim()) {
      setError("시리얼 번호를 입력해 주세요");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({ hospital_id: Number(form.hospital_id), serial_num: form.serial_num.trim() });
      onClose();
    } catch (submitError) {
      setError(submitError?.response?.data?.detail || submitError?.message || "등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="add-device-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="addDeviceTitle"
        className="flex w-[440px] max-w-full flex-col gap-5 rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="addDeviceTitle" className="text-xl font-bold text-[#1E2A3A]">
            장치 재고 등록
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
          병원에 새로 입고된 장치를 재고로 등록합니다. 환자 배정은 병원(부서)에서 진행합니다.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="deviceHospital" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            병원
          </label>
          <select
            id="deviceHospital"
            value={form.hospital_id}
            onChange={(event) => updateField("hospital_id", event.target.value)}
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
          >
            {hospitalOptions.length === 0 && <option value="">병원 목록을 불러오는 중</option>}
            {hospitalOptions.map((hospital) => (
              <option key={hospital.hospital_id} value={hospital.hospital_id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="deviceSerial" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            시리얼 번호
          </label>
          <input
            id="deviceSerial"
            type="text"
            value={form.serial_num}
            onChange={(event) => updateField("serial_num", event.target.value.toUpperCase())}
            placeholder="예: DEV-20260016"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] placeholder:font-sans placeholder:text-[#5A6B80] focus:outline-none"
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-[#2B6FE3] px-5 py-[10px] text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddDeviceModal;
