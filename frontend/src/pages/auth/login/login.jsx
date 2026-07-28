import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [hospitalId, setHospitalId] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <main className="login flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-10">
      <div className="login__wrap flex flex-col items-center gap-6">
        <section className="login__card w-[400px] max-w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
          <div className="login__header-strip bg-[#EDF1F6] px-6 py-3">
            <p className="text-xs font-bold tracking-wide text-[#5A6B80]">HOSPITAL LOGIN</p>
          </div>
          <div className="login__divider h-px bg-[#DCE3EC]" />
          <form className="login__body flex flex-col gap-5 p-8" onSubmit={handleSubmit}>
            <div className="login__brand flex flex-col items-center gap-3">
              <div className="login__brand-mark flex h-12 w-12 items-center justify-center rounded-xl bg-[#E60012]">
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
              <p className="text-[13px] text-[#5A6B80]">비접촉 환자 모니터링 시스템</p>
            </div>

            <div className="login__fields flex flex-col gap-4">
              <div className="login__field flex flex-col gap-[7px]">
                <label htmlFor="hospitalId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  아이디
                </label>
                <div className="login__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="hospitalId"
                    name="hospitalId"
                    type="text"
                    autoComplete="username"
                    placeholder="hospital_id"
                    value={hospitalId}
                    onChange={(event) => setHospitalId(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>

              <div className="login__field flex flex-col gap-[7px]">
                <label htmlFor="password" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  비밀번호
                </label>
                <div className="login__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
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
                    autoComplete="current-password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="login__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9]"
            >
              로그인
            </button>

            <label className="login__remember flex items-center gap-2 text-xs text-[#010102]">
              <input
                type="checkbox"
                name="keepSignedIn"
                checked={keepSignedIn}
                onChange={(event) => setKeepSignedIn(event.target.checked)}
                className="h-[14px] w-[14px] rounded-[3px] border border-[#2e3138] bg-[#F5F7FA]"
              />
              로그인 유지
            </label>

            <p className="login__help text-xs text-[#5A6B80]">
              <Link to="/signup" className="hover:text-[#2B6FE3] hover:underline">
                회원가입
              </Link>
              {" · "}
              <button type="button" className="hover:text-[#2B6FE3] hover:underline">
                비밀번호를 잊으셨나요?
              </button>
            </p>
          </form>
        </section>

        <footer className="login__footer flex flex-col items-center gap-[6px] text-center">
          <p className="text-[11px] text-[#62666D]">병원 관계자 전용 시스템 · 무단 접근 금지</p>
          <p className="font-mono text-[10px] text-[#62666D]">VITALGUARD · v2.4.1</p>
        </footer>
      </div>
    </main>
  );
}

export default Login;
