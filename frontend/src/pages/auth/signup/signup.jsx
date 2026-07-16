import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HospitalSearchModal from "../../../components/modals/search-modal/search-modal.jsx";
import logo from "../../../components/icon/37.5.png";
import { apiClient } from "../../../api/client.js";

function Signup() {
  const [departmentName, setDepartmentName] = useState("");
  const [hospital, setHospital] = useState(null);
  const [departmentLoginId, setDepartmentLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isHospitalSearchOpen, setIsHospitalSearchOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!hospital) {
      setError("소속 병원을 검색해서 선택해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/register/department", {
        hospital_name: hospital.name,
        area: hospital.area,
        department_name: departmentName,
        login_id: departmentLoginId,
        password,
      });

      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail ?? "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="signup flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-10">
      <section className="signup__card w-[460px] max-w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
        <div className="signup__header-strip bg-[#EDF1F6] px-6 py-3">
          <p className="text-xs font-bold tracking-wide text-[#5A6B80]">HOSPITAL REGISTRATION</p>
        </div>
        <div className="signup__divider h-px bg-[#DCE3EC]" />

        <form className="signup__body flex flex-col gap-5 p-8" onSubmit={handleSubmit}>
          <div className="signup__brand flex flex-col items-center gap-[10px]">
            <img src={logo} alt="37.5" className="h-12 w-12 object-contain" />
            <p className="text-[22px] font-extrabold text-[#1E2A3A]">37.5℃</p>
            <p className="text-base font-bold text-[#1E2A3A]">병원 부서 회원가입</p>
            <p className="text-[13px] text-[#5A6B80]">부서 계정 정보를 입력해 주세요</p>
          </div>

          <div className="signup__fields flex flex-col gap-4">
            <div className="signup__field flex flex-col gap-[7px]">
              <label htmlFor="departmentName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                부서명
              </label>
              <div className="signup__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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

            <div className="signup__field flex flex-col gap-[7px]">
              <label htmlFor="hospitalSearch" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                소속 병원
              </label>
              <button
                id="hospitalSearch"
                type="button"
                onClick={() => setIsHospitalSearchOpen(true)}
                className="signup__input flex h-12 items-center justify-between gap-[10px] rounded-lg border border-[#DCE3EC] bg-white px-[14px] text-left"
              >
                <span className="flex items-center gap-[10px]">
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
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className={`text-[15px] ${hospital ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                    {hospital ? hospital.name : "병원명 또는 주소로 검색"}
                  </span>
                </span>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#5A6B80]"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="signup__field flex flex-col gap-[7px]">
              <label htmlFor="departmentLoginId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                부서 아이디
              </label>
              <div className="signup__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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

            <div className="signup__field flex flex-col gap-[7px]">
              <label htmlFor="password" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                비밀번호
              </label>
              <div className="signup__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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

            <div className="signup__field flex flex-col gap-[7px]">
              <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                비밀번호 확인
              </label>
              <div className="signup__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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

          {error && <p className="signup__error text-xs font-semibold text-[#E0435D]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="signup__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>

          <p className="signup__back-to-login flex items-center justify-center gap-1 text-[13px]">
            <span className="text-[#5A6B80]">이미 계정이 있으신가요?</span>
            <Link to="/login" className="font-bold text-[#2B6FE3] hover:underline">
              로그인
            </Link>
          </p>
        </form>

        <div className="signup__footer flex flex-col items-center gap-[6px] pt-5 pb-6 text-center">
          <p className="text-[11px] text-[#62666D]">병원 관계자 전용 시스템 · 무단 접근 금지</p>
          <p className="font-mono text-[10px] text-[#62666D]">37.5℃ · v2.4.1</p>
        </div>
      </section>

      <HospitalSearchModal
        isOpen={isHospitalSearchOpen}
        onClose={() => setIsHospitalSearchOpen(false)}
        onSelect={setHospital}
      />
    </main>
  );
}

export default Signup;
