import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../../components/icon/icon.jsx";
import logo from "../../../components/icon/37.5.png";
import { apiClient } from "../../../api/client.js";
import { useAuthStore } from "../../../store/auth-store.js";

function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post("/auth/login", {
        login_id: adminId,
        password,
      });

      if (data.role !== "ADMIN") {
        setError("관리자 계정이 아닙니다.");
        return;
      }

      login({ accessToken: data.access_token, userId: data.user_id, role: data.role }, false);
      navigate("/admin/hospitals");
    } catch (err) {
      setError(err.response?.data?.detail ?? "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login flex min-h-screen items-center justify-center bg-[#15111F] px-6 py-10">
      <section className="admin-login__card w-[400px] max-w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
        <div className="admin-login__header-strip bg-[#EDF1F6] px-6 py-3">
          <p className="text-xs font-bold tracking-wide text-[#7C5CFC]">ADMIN CONSOLE ACCESS</p>
        </div>
        <div className="admin-login__divider h-px bg-[#DCE3EC]" />

        <form className="admin-login__body flex flex-col gap-5 p-8" onSubmit={handleSubmit}>
          <div className="admin-login__brand flex flex-col items-center gap-3">
            <img src={logo} alt="37.5" className="h-12 w-12 object-contain" />
            <p className="text-[22px] font-extrabold text-[#1E2A3A]">37.5℃</p>
            <p className="text-[13px] text-[#5A6B80]">관리자 콘솔 전용 접근</p>
          </div>

          <div className="admin-login__fields flex flex-col gap-4">
            <div className="admin-login__field flex flex-col gap-[7px]">
              <label htmlFor="adminId" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                관리자 아이디
              </label>
              <div className="admin-login__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <Icon name="user" size={18} className="shrink-0 text-[#5A6B80]" />
                <input
                  id="adminId"
                  name="adminId"
                  type="text"
                  autoComplete="username"
                  placeholder="admin_id"
                  value={adminId}
                  onChange={(event) => setAdminId(event.target.value)}
                  className="w-full border-0 bg-transparent text-[15px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>
            </div>

            <div className="admin-login__field flex flex-col gap-[7px]">
              <label htmlFor="adminPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                비밀번호
              </label>
              <div className="admin-login__input flex h-12 items-center gap-[10px] rounded-lg border border-[#DCE3EC] px-[14px]">
                <Icon name="lock" size={18} className="shrink-0 text-[#5A6B80]" />
                <input
                  id="adminPassword"
                  name="adminPassword"
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

          {error && <p className="admin-login__error text-xs font-semibold text-[#E0435D]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-login__submit h-[52px] w-full rounded-lg bg-[#7C5CFC] text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-[#6a4de0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "로그인 중..." : "관리자 로그인"}
          </button>
        </form>

        <div className="admin-login__footer flex flex-col items-center gap-[6px] px-6 py-4 text-center">
          <p className="text-[11px] text-[#62666D]">이 페이지는 /dev 경로로만 접근 가능합니다</p>
          <Link to="/login" className="text-[11px] font-semibold text-[#7C5CFC] hover:underline">
            메인 로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
