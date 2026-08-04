import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import "@/guardian/verify.css"

// 데모용 정답 인증번호 / 조회 결과
const DEMO_CODE = "123456"
const DEMO_FOUND_ID = "guardian1"

export default function FindId() {
  const navigate = useNavigate()

  // 성명
  const [name, setName] = useState("")
  const [nameWarning, setNameWarning] = useState("")
  const [nameShake, setNameShake] = useState(false)

  // 연락처 + 인증
  const [phone, setPhone] = useState("")
  const [phoneWarning, setPhoneWarning] = useState("")
  const [phoneShake, setPhoneShake] = useState(false)
  const [phoneSent, setPhoneSent] = useState(false)
  const [code, setCode] = useState("")
  const [codeWarning, setCodeWarning] = useState("")
  const [codeShake, setCodeShake] = useState(false)
  const [verified, setVerified] = useState(false)

  function validateName() {
    if (!name) return true
    if (!/^[가-힣]{2,}$/.test(name)) {
      setNameWarning("정확한 성명을 입력해 주세요.")
      setNameShake(true)
      setName("")
      return false
    }
    setNameWarning("")
    return true
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
    let out = digits
    if (digits.length > 3 && digits.length <= 7) {
      out = `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else if (digits.length > 7) {
      out = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }
    setPhone(out)
    setPhoneWarning("")
  }

  function handlePhoneBlur() {
    if (phone && !/^010-\d{4}-\d{4}$/.test(phone)) {
      setPhoneWarning("010-XXXX-XXXX 형태로 입력해 주세요.")
      setPhoneShake(true)
      setPhone("")
    } else {
      setPhoneWarning("")
    }
  }

  function handleSendCode() {
    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      setPhoneWarning("010-XXXX-XXXX 형태로 입력해 주세요.")
      setPhoneShake(true)
      setPhone("")
      return
    }
    setPhoneSent(true)
    setVerified(false)
    setCode("")
    setCodeWarning("")
  }

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
    if (!validateName() || !name) {
      setNameWarning("성명을 입력해주세요.")
      setNameShake(true)
      return
    }
    if (!verified) {
      setPhoneWarning("휴대폰 인증을 완료해 주세요.")
      setPhoneShake(true)
      return
    }
  }

  return (
    <Screen>
      <TopBar title="아이디 찾기" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={!verified ? <Button type="submit">확인</Button> : undefined}
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">가입 시 등록한 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">본인 확인 후 아이디를 알려드립니다.</p>
          </div>

          {!verified && (
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
                <span className="mb-1.5 block text-sm font-medium text-muted-foreground">연락처</span>
                <div className="flex w-full items-stretch gap-2">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="010-0000-0000"
                    aria-label="연락처"
                    className={cn(
                      "h-13 min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20",
                      phoneShake && "verify-shake",
                      phoneWarning && "verify-error-border",
                    )}
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    onAnimationEnd={() => setPhoneShake(false)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                    onClick={handleSendCode}
                  >
                    인증번호 발급
                  </Button>
                </div>
                {phoneWarning && (
                  <p className="verify-warning" role="alert">
                    <AlertCircle size={14} aria-hidden />
                    {phoneWarning}
                  </p>
                )}
              </div>

              {phoneSent && (
                <div className="fade-up">
                  <span className="mb-1.5 block text-sm font-medium text-muted-foreground">인증번호</span>
                  <div className="flex w-full items-stretch gap-2">
                    <input
                      id="code"
                      value={code}
                      onChange={handleCodeChange}
                      onAnimationEnd={() => setCodeShake(false)}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="인증번호 6자리"
                      aria-label="인증번호"
                      className={cn(
                        "verify-code-input h-13 min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20",
                        codeWarning && "verify-error-border",
                        codeShake && "verify-shake",
                      )}
                    />
                    <Button
                      type="button"
                      className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                      onClick={handleVerify}
                    >
                      확인
                    </Button>
                  </div>
                  {codeWarning && (
                    <p className="verify-warning" role="alert">
                      <AlertCircle size={14} aria-hidden />
                      {codeWarning}
                    </p>
                  )}
                  {!codeWarning && <p className="mt-1.5 text-xs text-muted-foreground">데모 인증번호: {DEMO_CODE}</p>}
                </div>
              )}
            </>
          )}

          {verified && (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={26} aria-hidden />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">회원님의 아이디는</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{DEMO_FOUND_ID}</p>
              <p className="mt-1 text-sm text-muted-foreground">입니다.</p>
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
        </StickyAction>
      </form>
    </Screen>
  )
}
