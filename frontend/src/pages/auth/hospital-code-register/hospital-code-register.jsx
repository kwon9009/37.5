import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../components/icon/37.5.png";
import { apiClient } from "../../../api/client.js";

function HospitalCodeRegister() {
  const [hospitalName, setHospitalName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!hospitalName.trim() || !area.trim() || !address.trim()) {
      setError("병원명, 지역, 주소를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/hospital-requests", {
        hospital_name: hospitalName.trim(),
        area: area.trim(),
        address: address.trim(),
      });

      navigate("/login", { state: { hospitalRequested: true } });
    } catch (err) {
      setError(err.response?.data?.detail ?? "등록 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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
            <img src={logo} alt="37.5" className="h-12 w-12 object-contain" />
            <p className="text-[22px] font-extrabold text-[#1E2A3A]">37.5℃</p>
            <p className="text-base font-bold text-[#1E2A3A]">병원 직접 등록하기</p>
            <p className="text-[13px] text-[#5A6B80]">검색 목록에 없는 병원의 정보를 입력해 등록을 요청해 주세요</p>
          </div>

          <div className="hospital-code-register__fields flex flex-col gap-4">
            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="hospitalName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                병원명
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
                  <path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18Z" />
                  <path d="M6 12H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
                  <path d="M18 9h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2" />
                  <path d="M10 6h4" />
                  <path d="M10 10h4" />
                  <path d="M10 14h4" />
                  <path d="M10 18h4" />
                </svg>
                <input
                  id="hospitalName"
                  name="hospitalName"
                  type="text"
                  placeholder="예: 서울중앙병원"
                  value={hospitalName}
                  onChange={(event) => setHospitalName(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="area" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                지역
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
                  <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
                  <path d="M15 5.764v15" />
                  <path d="M9 3.236v15" />
                </svg>
                <input
                  id="area"
                  name="area"
                  type="text"
                  placeholder="예: 서울"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="hospital-code-register__field flex flex-col gap-[7px]">
              <label htmlFor="address" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                병원 주소
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
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="예: 서울특별시 중구 세종대로 110"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && <p className="hospital-code-register__error text-xs font-semibold text-[#E0435D]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="hospital-code-register__submit h-[52px] w-full rounded-lg bg-[#2B6FE3] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#2560c9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "요청 중..." : "병원 등록 요청하기"}
          </button>

          <p className="hospital-code-register__back flex items-center justify-center gap-1 text-[13px]">
            <Link to="/signup" className="font-bold text-[#2B6FE3] hover:underline">
              병원 검색으로 돌아가기
            </Link>
          </p>
        </form>

        <div className="hospital-code-register__footer flex flex-col items-center gap-[6px] pt-5 pb-6 text-center">
          <p className="text-[11px] text-[#62666D]">병원 관계자 전용 시스템 · 무단 접근 금지</p>
          <p className="font-mono text-[10px] text-[#62666D]">37.5℃ · v2.4.1</p>
        </div>
      </section>
    </main>
  );
}

export default HospitalCodeRegister;
