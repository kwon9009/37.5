import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, MailCheck } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import { apiClient, getErrorMessage } from "@/api/client.js"
import "@/guardian/verify.css"

// 여기서는 비밀번호를 바로 바꾸지 않는다. 등록된 메일로 재설정 링크를 보내고,
// 새 비밀번호는 그 링크를 연 사람만 ResetPassword 화면에서 정할 수 있다.
// 메일함에 접근할 수 있는 사람만 비밀번호를 바꿀 수 있게 하기 위함이다.
export default function FindPassword() {
  const navigate = useNavigate()

  const [userid, setUserid] = useState("")
  const [useridWarning, setUseridWarning] = useState("")
  const [useridShake, setUseridShake] = useState(false)

  const [email, setEmail] = useState("")
  const [emailWarning, setEmailWarning] = useState("")
  const [emailShake, setEmailShake] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sentMessage, setSentMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!userid) {
      setUseridWarning("아이디를 입력해주세요.")
      setUseridShake(true)
      return
    }
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
      const { data } = await apiClient.post("/auth/password-reset/request", {
        login_id: userid.trim(),
        email: email.trim(),
      })
      setSentMessage(data.message)
    } catch (err) {
      setError(getErrorMessage(err, "요청 중 오류가 발생했습니다."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <TopBar title="비밀번호 찾기" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={
            !sentMessage ? (
              <Button type="submit" disabled={submitting}>
                {submitting ? "보내는 중..." : "재설정 링크 받기"}
              </Button>
            ) : undefined
          }
        >
          {!sentMessage && (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">가입 시 등록한 정보를 입력해 주세요</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <div>
                <Field
                  id="userid"
                  label="아이디"
                  placeholder="아이디를 입력하세요"
                  value={userid}
                  onChange={(e) => {
                    setUserid(e.target.value)
                    setUseridWarning("")
                  }}
                  onAnimationEnd={() => setUseridShake(false)}
                  className={cn(useridShake && "verify-shake", useridWarning && "verify-error-border")}
                />
                {useridWarning && (
                  <p className="verify-warning" role="alert">
                    <AlertCircle size={14} aria-hidden />
                    {useridWarning}
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

              <button
                type="button"
                className="self-start text-sm text-muted-foreground underline"
                onClick={() => navigate("/guardian/find-id")}
              >
                아이디가 기억나지 않으세요?
              </button>

              {error && (
                <p className="verify-warning" role="alert">
                  <AlertCircle size={14} aria-hidden />
                  {error}
                </p>
              )}
            </>
          )}

          {sentMessage && (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <MailCheck size={26} aria-hidden />
              </span>
              <p className="mt-4 text-balance leading-relaxed text-muted-foreground">{sentMessage}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                메일이 보이지 않으면 스팸함도 확인해 주세요. 링크는 30분 동안만 사용할 수 있습니다.
              </p>
              <Button className="mt-6" onClick={() => navigate("/guardian/login")}>
                로그인 화면으로
              </Button>
            </div>
          )}
        </StickyAction>
      </form>
    </Screen>
  )
}
