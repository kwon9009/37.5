import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2, Check } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { Button, Field } from "@/components/ui"
import { cn } from "@/lib/utils"
import "@/verify.css"

// 데모용 정답 인증번호
const DEMO_CODE = "123456"

const pwRules = [
  { key: "digit", label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
  { key: "letter", label: "영문(대/소문자)", test: (v: string) => /[a-zA-Z]/.test(v) },
  { key: "special", label: "특수기호", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function Signup() {
  const navigate = useNavigate()

  // 인증 상태
  const [phoneSent, setPhoneSent] = useState(false)
  const [code, setCode] = useState("")
  const [codeWarning, setCodeWarning] = useState("")
  const [codeShake, setCodeShake] = useState(false)
  const [verified, setVerified] = useState(false)

  // 비밀번호 상태
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwShake, setPwShake] = useState(false)
  const [pwWarning, setPwWarning] = useState("")

  const pwValid = pwRules.every((r) => r.test(pw))

  // 인증번호: 숫자만 입력, 숫자 외 입력 시 경고
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (/[^0-9]/.test(raw)) {
      setCodeWarning("숫자만 입력할 수 있습니다.")
      setCodeShake(true)
    } else {
      setCodeWarning("")
    }
    setVerified(false)
    setCode(raw.replace(/[^0-9]/g, "").slice(0, 6))
  }

  // 확인 버튼: 인증번호 검증. 틀리면 진동 + 입력값 삭제
  function handleVerify() {
    if (code.length !== 6) {
      setCodeWarning("인증번호 6자리를 정확히 입력해 주세요.")
      setCodeShake(true)
      setCode("")
      return
    }
    if (code !== DEMO_CODE) {
      setCodeWarning("인증번호가 일치하지 않습니다.")
      setCodeShake(true)
      setCode("")
      return
    }
    setVerified(true)
    setCodeWarning("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 비밀번호 요구사항 미충족 시 진동 + 입력값 삭제
    if (!pwValid) {
      setPwWarning("비밀번호 요구사항을 모두 충족해 주세요.")
      setPwShake(true)
      setPw("")
      setPw2("")
      return
    }
    if (pw !== pw2) {
      setPwWarning("비밀번호가 일치하지 않습니다.")
      setPwShake(true)
      setPw2("")
      return
    }
    setPwWarning("")
    navigate("/patient-info")
  }

  return (
    <Screen>
      <TopBar title="회원가입" back />
      <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-5 px-5 py-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">계정 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">보호자 본인 인증 후 계정을 생성합니다.</p>
          </div>

          <Field id="name" label="성명" placeholder="성명을 입력하세요" required />

          {/* 연락처 + 인증번호 발급 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">연락처</span>
            <div className="flex w-full items-stretch gap-2">
              <Field id="phone" type="tel" placeholder="휴대폰 번호" className="flex-1" required />
              <Button
                type="button"
                variant="outline"
                className="h-13 w-auto shrink-0 whitespace-nowrap px-4 text-sm"
                onClick={() => {
                  setPhoneSent(true)
                  setVerified(false)
                  setCode("")
                  setCodeWarning("")
                }}
              >
                인증번호 발급
              </Button>
            </div>
          </div>

          {/* 인증번호 확인 시퀀스 */}
          {phoneSent && (
            <div className="fade-up">
              <span className="mb-1.5 block text-sm font-medium text-muted-foreground">인증번호</span>
              <div className="flex w-full items-stretch gap-2">
                <input
                  id="code"
                  value={code}
                  onChange={handleCodeChange}
                  onAnimationEnd={() => setCodeShake(false)}
                  disabled={verified}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="인증번호 6자리"
                  aria-label="인증번호"
                  className={cn(
                    "verify-code-input h-13 flex-1 rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-60",
                    codeWarning && "verify-error-border",
                    codeShake && "verify-shake",
                  )}
                />
                <Button
                  type="button"
                  variant={verified ? "muted" : "primary"}
                  className="h-13 w-auto shrink-0 whitespace-nowrap px-5 text-sm"
                  disabled={verified}
                  onClick={handleVerify}
                >
                  {verified ? "완료" : "확인"}
                </Button>
              </div>
              {codeWarning && (
                <p className="verify-warning" role="alert">
                  <AlertCircle size={14} aria-hidden />
                  {codeWarning}
                </p>
              )}
              {verified && (
                <p className="verify-success">
                  <CheckCircle2 size={14} aria-hidden />
                  인증이 완료되었습니다.
                </p>
              )}
              {!verified && !codeWarning && (
                <p className="mt-1.5 text-xs text-muted-foreground">데모 인증번호: {DEMO_CODE}</p>
              )}
            </div>
          )}

          <div className="h-px bg-border" />

          <Field id="userid" label="아이디" placeholder="아이디를 입력하세요" required />

          {/* 비밀번호 + 요구사항 */}
          <div>
            <Field
              id="pw"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                setPwWarning("")
              }}
              onAnimationEnd={() => setPwShake(false)}
              className={cn(pwShake && "verify-shake", pwWarning && "verify-error-border")}
              required
            />
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {pwRules.map((r) => {
                const ok = r.test(pw)
                return (
                  <li
                    key={r.key}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium transition",
                      ok ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full border",
                        ok ? "border-success bg-success text-card" : "border-border text-transparent",
                      )}
                    >
                      <Check size={11} strokeWidth={3} aria-hidden />
                    </span>
                    {r.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <Field
              id="pw2"
              label="비밀번호 재입력"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={pw2}
              onChange={(e) => {
                setPw2(e.target.value)
                setPwWarning("")
              }}
              onAnimationEnd={() => setPwShake(false)}
              className={cn(pwShake && "verify-shake", pwWarning && "verify-error-border")}
              required
            />
            {pwWarning && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                {pwWarning}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit">다음</Button>
        </div>
      </form>
    </Screen>
  )
}
