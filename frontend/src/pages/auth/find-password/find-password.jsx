import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../components/icon/37.5.png";

function FindPassword() {
  const [step, setStep] = useState(1);
  const [loginId, setLoginId] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerify = (event) => {
    event.preventDefault();
    setError("");

    if (!loginId.trim() || !hospitalCode.trim()) {
      setError("아이디와 병원 코드를 모두 입력해 주세요.");
      return;
    }

    setStep(2);
  };

  const handleResetPassword = (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    navigate("/login", { state: { passwordReset: true } });
  };

  return (
    <main className="find-password flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-10">
      <section className="find-password__card w-[400px] max-w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
        <div className="find-password__header-strip bg-[#EDF1F6] px-6 py-3">
          <p className="text-xs font-bold tracking-wide text-[#5A6B80]">HOSPITAL LOGIN</p>
        </div>
        <div className="find-password__divider h-px bg-[#DCE3EC]" />

        {step === 1 ? (
          <form className="find-password__body flex flex-col gap-5 p-8" onSubmit={handleVerify}>
            <div className="find-password__brand flex flex-col items-center gap-3">
              <img src={logo} alt="37.5" className="h-12 w-12 object-contain" />
              <p className="text-[22px] font-extrabold text-[#1E2A3A]">37.5℃</p>
              <p className="text-base font-bold text-[#1E2A3A]">비밀번호 찾기</p>
              <p className="text-[13px] text-[#5A6B80]">아이디와 소속 병원 코드로 본인 확인을 해주세요</p>
            </div>

            <div className="find-password__fields flex flex-col gap-4">
              <div className="find-password__field flex flex-col gap-[7px]">
                <label htmlFor="loginId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  아이디
                </label>
                <div className="find-password__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                  <input
                    id="loginId"
                    name="loginId"
                    type="text"
                    autoComplete="username"
                    placeholder="login_id"
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>

              <div className="find-password__field flex flex-col gap-[7px]">
                <label htmlFor="hospitalCode" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  병원 코드
                </label>
                <div className="find-password__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                  <input
                    id="hospitalCode"
                    name="hospitalCode"
                    type="text"
                    placeholder="예: SNUH"
                    value={hospitalCode}
                    onChange={(event) => setHospitalCode(event.target.value.toUpperCase())}
                    className="w-full border-0 bg-transparent text-[15px] uppercase text-[#1E2A3A] placeholder:normal-case placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && <p className="find-password__error text-xs font-semibold text-[#E0435D]">{error}</p>}

            <button
              type="submit"
              className="find-password__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9]"
            >
              본인 확인
            </button>

            <p className="find-password__back flex items-center justify-center gap-1 text-[13px]">
              <Link to="/login" className="font-bold text-[#2B6FE3] hover:underline">
                로그인으로 돌아가기
              </Link>
            </p>
          </form>
        ) : (
          <form className="find-password__body flex flex-col gap-5 p-8" onSubmit={handleResetPassword}>
            <div className="find-password__brand flex flex-col items-center gap-3">
              <img src={logo} alt="37.5" className="h-12 w-12 object-contain" />
              <p className="text-[22px] font-extrabold text-[#1E2A3A]">37.5℃</p>
              <p className="text-base font-bold text-[#1E2A3A]">새 비밀번호 설정</p>
              <p className="text-[13px] text-[#5A6B80]">사용할 새 비밀번호를 입력해 주세요</p>
            </div>

            <div className="find-password__fields flex flex-col gap-4">
              <div className="find-password__field flex flex-col gap-[7px]">
                <label htmlFor="newPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  새 비밀번호
                </label>
                <div className="find-password__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>

              <div className="find-password__field flex flex-col gap-[7px]">
                <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  새 비밀번호 확인
                </label>
                <div className="find-password__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && <p className="find-password__error text-xs font-semibold text-[#E0435D]">{error}</p>}

            <button
              type="submit"
              className="find-password__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9]"
            >
              비밀번호 변경하기
            </button>
          </form>
        )}

        <div className="find-password__footer flex flex-col items-center gap-[6px] pt-5 pb-6 text-center">
          <p className="text-[11px] text-[#62666D]">병원 관계자 전용 시스템 · 무단 접근 금지</p>
          <p className="font-mono text-[10px] text-[#62666D]">37.5℃ · v2.4.1</p>
        </div>
      </section>
    </main>
  );
}

export default FindPassword;
