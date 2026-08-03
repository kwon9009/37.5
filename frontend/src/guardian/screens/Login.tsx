import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Screen } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { apiClient } from "@/api/client.js"
import { useAuthStore } from "@/store/auth-store.js"

const ROLE_HOME: Record<string, string> = {
  GUARDIAN: "/guardian/home",
  DEPARTMENT: "/dashboard",
  ADMIN: "/admin/hospitals",
}

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const { data } = await apiClient.post("/auth/login", {
        login_id: loginId,
        password,
      })
      login(
        {
          accessToken: data.access_token,
          userId: data.user_id,
          role: data.role,
          loginId,
        },
        false,
      )
      navigate(ROLE_HOME[data.role] ?? "/guardian/home", { replace: true })
    } catch {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.")
    }
  }

  return (
    <Screen>
      {/* 스크롤 영역 + m-auto 정렬.
          이전에는 스크롤 없이 justify-center 만 있어서, 키보드가 올라와 화면이 짧아지면
          로그인·회원가입 버튼이 화면 밖으로 잘리고 스크롤로도 볼 수 없었다.
          m-auto 는 공간이 남으면 가운데, 부족하면 위쪽 정렬이 되어 전부 스크롤된다. */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
        <div className="m-auto w-full">
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/images/37-5-logo.png"
            alt="37.5°C 건강 모니터링 로고"
            className="mb-4 h-24 w-24 object-contain drop-shadow-sm"
          />
          <h1 className="text-3xl font-bold text-foreground">37.5°C</h1>
          <p className="mt-1 text-sm text-muted-foreground">따스한 마음으로 세상을 밝히자!</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field
            id="loginid"
            label="아이디"
            placeholder="아이디"
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <Field
            id="loginpw"
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" className="mt-2">
            로그인
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <button className="hover:text-foreground" onClick={() => navigate("/guardian/find-id")}>
            아이디 찾기
          </button>
          <span className="h-3 w-px bg-border" />
          <button className="hover:text-foreground" onClick={() => navigate("/guardian/find-password")}>
            비밀번호 찾기
          </button>
        </div>
        </div>
      </div>
      <div className="shrink-0 px-6 pb-10">
        <Button variant="outline" onClick={() => navigate("/guardian/terms")}>
          회원가입
        </Button>
      </div>
    </Screen>
  )
}
