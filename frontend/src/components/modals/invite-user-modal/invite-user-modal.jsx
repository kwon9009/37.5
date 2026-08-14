import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";

const EMPTY_FORM = { hospital_id: "", login_id: "", password: "", name: "", email: "", phone: "" };

function InviteUserModal({ isOpen, onClose, onSubmit, hospitalOptions = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...EMPTY_FORM, hospital_id: hospitalOptions[0]?.hospital_id ?? "" });
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
    if (!form.login_id.trim() || !form.password.trim() || !form.name.trim() || !form.email.trim().includes("@") || !form.phone.trim()) {
      setError("모든 항목을 올바르게 입력해 주세요");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.(form);
      onClose();
    } catch (submitError) {
      setError(submitError?.response?.data?.detail || submitError?.message || "등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="invite-user-modal fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A3ACC] p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inviteUserTitle"
        className="flex w-[440px] max-w-full flex-col gap-5 rounded-2xl border border-[#DCE3EC] bg-white p-8 shadow-[0_12px_32px_rgba(30,42,58,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="inviteUserTitle" className="text-xl font-bold text-[#1E2A3A]">
            병원 관리자 계정 발급
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
          병원에 배정할 관리자 계정을 발급합니다. 의료진·보호자 계정은 각자 앱에서 직접 가입합니다.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="inviteHospital" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            소속 병원
          </label>
          <select
            id="inviteHospital"
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

        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="inviteName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              이름
            </label>
            <input
              id="inviteName"
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="담당자 이름"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="invitePhone" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              연락처
            </label>
            <input
              id="invitePhone"
              type="text"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="010-0000-0000"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="inviteEmail" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            이메일
          </label>
          <input
            id="inviteEmail"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="name@hospital.kr"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="inviteLoginId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              로그인 아이디
            </label>
            <input
              id="inviteLoginId"
              type="text"
              value={form.login_id}
              onChange={(event) => updateField("login_id", event.target.value)}
              placeholder="예: djcentral_admin"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] placeholder:font-sans placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="invitePassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              초기 비밀번호
            </label>
            <input
              id="invitePassword"
              type="text"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="발급 후 전달"
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] placeholder:font-sans placeholder:text-[#5A6B80] focus:outline-none"
            />
          </div>
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
            {submitting ? "발급 중..." : "계정 발급"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteUserModal;
