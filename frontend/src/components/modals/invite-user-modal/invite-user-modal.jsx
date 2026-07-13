import { useEffect, useState } from "react";
import Icon from "../../icon/icon.jsx";
import { HOSPITALS } from "../../../data/admin.js";

const ROLE_OPTIONS = ["시스템관리자", "의사", "간호사", "보호자"];

const INITIAL_FORM = { name: "", email: "", role: ROLE_OPTIONS[1], hospital: HOSPITALS[0]?.name ?? "" };

function InviteUserModal({ isOpen, onClose, onSubmit }) {
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
    if (!form.name.trim() || !form.email.trim().includes("@")) {
      setError("이름과 올바른 이메일을 입력해 주세요");
      return;
    }
    onSubmit?.(form);
    onClose();
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
            사용자 초대
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

        <p className="-mt-3 text-[13px] text-[#5A6B80]">초대 이메일을 받을 사용자의 정보를 입력하세요</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="inviteName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
            이름
          </label>
          <input
            id="inviteName"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="사용자 이름"
            className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
          />
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
            <label htmlFor="inviteRole" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              역할
            </label>
            <select
              id="inviteRole"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="inviteHospital" className="text-xs font-bold tracking-wide text-[#5A6B80]">
              소속 병원
            </label>
            <select
              id="inviteHospital"
              value={form.hospital}
              onChange={(event) => updateField("hospital", event.target.value)}
              className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
            >
              {HOSPITALS.map((hospital) => (
                <option key={hospital.id} value={hospital.name}>
                  {hospital.name}
                </option>
              ))}
            </select>
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
          <button type="button" onClick={handleSubmit} className="rounded-lg bg-[#2B6FE3] px-5 py-[10px] text-sm font-bold text-white">
            초대 보내기
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteUserModal;
