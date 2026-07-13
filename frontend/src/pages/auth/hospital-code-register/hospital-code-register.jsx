import { useState } from "react";
import { Link } from "react-router-dom";

function HospitalCodeRegister() {
  const [departmentName, setDepartmentName] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [departmentLoginId, setDepartmentLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="hospital-code-register flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-10">
      <section className="hospital-code-register__card w-[460px] max-w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
        <div className="hospital-code-register__header-strip bg-[#EDF1F6] px-6 py-3">
          <p className="text-xs font-bold tracking-wide text-[#5A6B80]">HOSPITAL REGISTRATION</p>
        </div>
        <div className="hospital-code-register__divider h-px bg-[#DCE3EC]" />

        <form className="hospital-code-register__body flex flex-col gap-5 p-8" onSubmit={handleSubmit}>
          <div className="hospital-code-register__brand flex flex-col items-center gap-[10px]">
            <div className="hospital-code-register__brand-mark flex h-12 w-12 items-center justify-center rounded-xl bg-[#E60012]">
              <svg
                aria-hidden="true"
                focusable="false"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </div>
            <p className="text-[22px] font-extrabold text-[#1E2A3A]">VITALGUARD</p>
            <p className="text-base font-bold text-[#1E2A3A]">병원 코드로 등록하기</p>
            <p className="text-[13px] text-[#5A6B80]">본사에서 발급받은 병원 코드를 입력해 주세요</p>
          </div>

          <div className="hospital-code-register__fields flex flex-col gap-4">
            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="departmentName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                부서명
              </label>
              <div className="hospital-code-register__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <input
                  id="departmentName"
                  name="departmentName"
                  type="text"
                  placeholder="예: 응급의학과"
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="hospitalCode" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                병원 코드
              </label>
              <div className="hospital-code-register__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                <input
                  id="hospitalCode"
                  name="hospitalCode"
                  type="text"
                  placeholder="예: VG-2024-XXXX"
                  value={hospitalCode}
                  onChange={(event) => setHospitalCode(event.target.value.toUpperCase())}
                  className="w-full border-0 bg-transparent text-[15px] uppercase text-[#1E2A3A] placeholder:normal-case placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="departmentLoginId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                부서 아이디
              </label>
              <div className="hospital-code-register__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M6.17 15a3 3 0 0 1 5.66 0" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M16 10h2" />
                  <path d="M16 14h2" />
                </svg>
                <input
                  id="departmentLoginId"
                  name="departmentLoginId"
                  type="text"
                  autoComplete="username"
                  placeholder="로그인에 사용할 아이디"
                  value={departmentLoginId}
                  onChange={(event) => setDepartmentLoginId(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="password" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                비밀번호
              </label>
              <div className="hospital-code-register__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                비밀번호 확인
              </label>
              <div className="hospital-code-register__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="hospital-code-register__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9]"
          >
            등록하기
          </button>

          <p className="hospital-code-register__back flex items-center justify-center gap-1 text-[13px]">
            <Link to="/signup" className="font-bold text-[#2B6FE3] hover:underline">
              병원 검색으로 돌아가기
            </Link>
          </p>

          <p className="hospital-code-register__back-to-login flex items-center justify-center gap-1 text-[13px]">
            <span className="text-[#5A6B80]">이미 계정이 있으신가요?</span>
            <Link to="/login" className="font-bold text-[#2B6FE3] hover:underline">
              로그인
            </Link>
          </p>
        </form>

        <div className="hospital-code-register__footer flex flex-col items-center gap-[6px] pt-5 pb-6 text-center">
          <p className="text-[11px] text-[#62666D]">병원 관계자 전용 시스템 · 무단 접근 금지</p>
          <p className="font-mono text-[10px] text-[#62666D]">VITALGUARD · v2.4.1</p>
        </div>
      </section>
    </main>
  );
}

export default HospitalCodeRegister;
