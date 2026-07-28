import { useNavigate } from "react-router-dom"
import { Screen } from "@/components/Screen"
import { Button, Field } from "@/components/ui"

export default function Login() {
  const navigate = useNavigate()
  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/images/37-5-logo.png"
            alt="37.5°C 건강 모니터링 로고"
            className="mb-4 h-24 w-24 object-contain drop-shadow-sm"
          />
          <h1 className="text-3xl font-bold text-foreground">37.5°C</h1>
          <p className="mt-1 text-sm text-muted-foreground">따스한 마음으로 세상을 밝히자!</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            navigate("/home")
          }}
        >
          <Field id="loginid" label="아이디" placeholder="아이디" autoComplete="username" />
          <Field
            id="loginpw"
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
          />
          <Button type="submit" className="mt-2">
            로그인
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <button className="hover:text-foreground">아이디 찾기</button>
          <span className="h-3 w-px bg-border" />
          <button className="hover:text-foreground">비밀번호 찾기</button>
        </div>
      </div>
      <div className="px-6 pb-10">
        <Button variant="outline" onClick={() => navigate("/terms")}>
          회원가입
        </Button>
      </div>
    </Screen>
  )
}
