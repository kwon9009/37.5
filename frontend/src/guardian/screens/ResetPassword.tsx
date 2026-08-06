import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, Check, CheckCircle2, Loader2 } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import { apiClient, getErrorMessage } from "@/api/client.js"
import "@/guardian/verify.css"

const pwRules = [
  { key: "letter", label: "영문(대/소문자)", test: (v: string) => /[a-zA-Z]/.test(v) },
  { key: "digit", label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
  { key: "special", label: "특수기호", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

// 메일로 받은 재설정 링크를 타고 들어오는 화면.
// 링크의 token이 본인 확인을 대신하므로 로그인 없이 열린다.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""

  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwShake, setPwShake] = useState(false)
  const [pwWarning, setPwWarning] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // 링크가 아직 쓸 수 있는지 화면을 열 때 바로 확인한다.
  // 저장할 때만 확인하면, 이미 쓴 링크로도 입력 폼이 뜨고
  // 새 비밀번호를 다 채운 뒤에야 거부당하게 된다.
  const [checking, setChecking] = useState(true)
  const [linkError, setLinkError] = useState("")

  const pwValid = pwRules.every((r) => r.test(pw))

  useEffect(() => {
    if (!token) {
      setChecking(false)
      return
    }

    let cancelled = false
    apiClient
      .get("/auth/password-reset/verify", { params: { token } })
      .then(() => {
        if (!cancelled) setChecking(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLinkError(getErrorMessage(err, "링크를 확인할 수 없습니다."))
        setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwWarning("")

    if (!pw || !pw2) {
      setPwWarning("비밀번호를 입력해주세요.")
      setPwShake(true)
      return
    }
    if (!pwValid) {
      setPwWarning("비밀번호 요구사항을 모두 충족해 주세요.")
      setPwShake(true)
      return
    }
    if (pw !== pw2) {
      setPwWarning("비밀번호가 일치하지 않습니다.")
      setPwShake(true)
      setPw2("")
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post("/auth/password-reset/confirm", {
        token,
        new_password: pw,
      })
      setDone(true)
    } catch (err) {
      // 만료·재사용·위조는 서버가 이유를 알려준다. 그대로 보여준다.
      setPwWarning(getErrorMessage(err, "비밀번호 변경에 실패했습니다."))
      setPwShake(true)
    } finally {
      setSubmitting(false)
    }
  }

  // 링크를 확인하는 동안 (아주 짧지만, 폼이 깜빡 보였다 사라지는 걸 막는다)
  if (checking) {
    return (
      <Screen>
        <TopBar title="비밀번호 재설정" back />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Loader2 size={32} className="animate-spin text-muted-foreground" aria-hidden />
          <p className="mt-4 text-sm text-muted-foreground">링크를 확인하고 있습니다...</p>
        </div>
      </Screen>
    )
  }

  // 토큰이 없거나(주소만 친 경우), 이미 사용했거나 만료된 링크
  if (!token || linkError) {
    return (
      <Screen>
        <TopBar title="비밀번호 재설정" back />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-destructive/15 text-destructive">
            <AlertCircle size={30} aria-hidden />
          </span>
          <h2 className="mt-5 text-lg font-bold text-foreground">
            {token ? "사용할 수 없는 링크입니다" : "유효하지 않은 접근입니다"}
          </h2>
          <p className="mt-2 text-balance leading-relaxed text-muted-foreground">
            {token ? linkError : "비밀번호 재설정은 메일로 받은 링크를 통해서만 진행할 수 있습니다."}
          </p>
          <Button className="mt-8" onClick={() => navigate("/guardian/find-password")}>
            재설정 링크 다시 받기
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar title="비밀번호 재설정" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={
            !done ? (
              <Button type="submit" disabled={submitting}>
                {submitting ? "변경 중..." : "비밀번호 변경"}
              </Button>
            ) : undefined
          }
        >
          {!done && (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">새 비밀번호를 정해 주세요</h2>
                <p className="mt-1 text-sm text-muted-foreground">변경 후에는 새 비밀번호로 로그인해 주세요.</p>
              </div>

              <div>
                <Field
                  id="pw"
                  label="새 비밀번호"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value)
                    setPwWarning("")
                  }}
                  onAnimationEnd={() => setPwShake(false)}
                  className={cn(pwShake && "verify-shake", pwWarning && "verify-error-border")}
                />
                <ul className="mt-2 flex items-center gap-3">
                  {pwRules.map((r) => {
                    const ok = r.test(pw)
                    return (
                      <li
                        key={r.key}
                        className={cn(
                          "flex items-center gap-1.5 whitespace-nowrap text-xs font-medium transition",
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
                  label="새 비밀번호 재입력"
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  value={pw2}
                  onChange={(e) => {
                    setPw2(e.target.value)
                    setPwWarning("")
                  }}
                  onAnimationEnd={() => setPwShake(false)}
                  className={cn(pwShake && "verify-shake", pwWarning && "verify-error-border")}
                />
                {pwWarning && (
                  <p className="verify-warning" role="alert">
                    <AlertCircle size={14} aria-hidden />
                    {pwWarning}
                  </p>
                )}
              </div>
            </>
          )}

          {done && (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={26} aria-hidden />
              </span>
              <p className="mt-4 font-bold text-foreground">비밀번호가 변경되었습니다</p>
              <p className="mt-2 text-sm text-muted-foreground">새 비밀번호로 로그인해 주세요.</p>
              <Button className="mt-6" onClick={() => navigate("/guardian/login", { replace: true })}>
                로그인하기
              </Button>
            </div>
          )}
        </StickyAction>
      </form>
    </Screen>
  )
}
