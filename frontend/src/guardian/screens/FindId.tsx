import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import { apiClient, getErrorMessage } from "@/api/client.js"
import "@/guardian/verify.css"

export default function FindId() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [nameWarning, setNameWarning] = useState("")
  const [nameShake, setNameShake] = useState(false)

  const [email, setEmail] = useState("")
  const [emailWarning, setEmailWarning] = useState("")
  const [emailShake, setEmailShake] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  // 찾기 결과. null이면 아직 조회 전
  const [result, setResult] = useState<{ found: boolean; maskedId: string | null; message: string } | null>(null)

  function validateName() {
    if (name && !/^[가-힣]{2,}$/.test(name)) {
      setNameWarning("정확한 성명을 입력해 주세요.")
      setNameShake(true)
      return false
    }
    setNameWarning("")
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name) {
      setNameWarning("성명을 입력해주세요.")
      setNameShake(true)
      return
    }
    if (!validateName()) return

    if (!email) {
      setEmailWarning("이메일을 입력해주세요.")
      setEmailShake(true)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailWarning("이메일 형식이 올바르지 않습니다.")
      setEmailShake(true)
      return
    }

    setSubmitting(true)
    try {
      const { data } = await apiClient.post("/auth/find-id", {
        name: name.trim(),
        email: email.trim(),
      })
      setResult({ found: data.found, maskedId: data.masked_login_id, message: data.message })
    } catch (err) {
      setError(getErrorMessage(err, "조회 중 오류가 발생했습니다."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <TopBar title="아이디 찾기" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={
            !result ? (
              <Button type="submit" disabled={submitting}>
                {submitting ? "조회 중..." : "확인"}
              </Button>
            ) : undefined
          }
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">가입 시 등록한 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">본인 확인 후 아이디를 알려드립니다.</p>
          </div>

          {!result && (
            <>
              <div>
                <Field
                  id="name"
                  label="성명"
                  placeholder="성명을 입력하세요"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameWarning("")
                  }}
                  onBlur={validateName}
                  onAnimationEnd={() => setNameShake(false)}
                  className={cn(nameShake && "verify-shake", nameWarning && "verify-error-border")}
                />
                {nameWarning && (
                  <p className="verify-warning" role="alert">
                    <AlertCircle size={14} aria-hidden />
                    {nameWarning}
                  </p>
                )}
              </div>

              <div>
                <Field
                  id="email"
                  label="이메일"
                  type="email"
                  placeholder="가입 시 등록한 이메일"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailWarning("")
                  }}
                  onAnimationEnd={() => setEmailShake(false)}
                  className={cn(emailShake && "verify-shake", emailWarning && "verify-error-border")}
                />
                {emailWarning && (
                  <p className="verify-warning" role="alert">
                    <AlertCircle size={14} aria-hidden />
                    {emailWarning}
                  </p>
                )}
              </div>

              {error && (
                <p className="verify-warning" role="alert">
                  <AlertCircle size={14} aria-hidden />
                  {error}
                </p>
              )}
            </>
          )}

          {result?.found && (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={26} aria-hidden />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">회원님의 아이디는</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{result.maskedId}</p>
              <p className="mt-1 text-sm text-muted-foreground">입니다.</p>
              <p className="mt-3 text-xs text-muted-foreground">
                보안을 위해 가운데 일부를 가려서 보여드립니다.
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/guardian/find-password")}>
                  비밀번호 찾기
                </Button>
                <Button className="flex-1" onClick={() => navigate("/guardian/login")}>
                  로그인하기
                </Button>
              </div>
            </div>
          )}

          {result && !result.found && (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertCircle size={26} aria-hidden />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">{result.message}</p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                  다시 입력
                </Button>
                <Button className="flex-1" onClick={() => navigate("/guardian/signup")}>
                  회원가입
                </Button>
              </div>
            </div>
          )}
        </StickyAction>
      </form>
    </Screen>
  )
}
