import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2, Check } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import "@/guardian/verify.css"

// 데모용 정답 인증번호
const DEMO_CODE = "123456"

const pwRules = [
  { key: "letter", label: "영문(대/소문자)", test: (v: string) => /[a-zA-Z]/.test(v) },
  { key: "digit", label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
  { key: "special", label: "특수기호", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function FindPassword() {
  const navigate = useNavigate()

  // 아이디
  const [userid, setUserid] = useState("")
  const [useridWarning, setUseridWarning] = useState("")
  const [useridShake, setUseridShake] = useState(false)

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

  // 새 비밀번호
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwShake, setPwShake] = useState(false)
  const [pwWarning, setPwWarning] = useState("")
  const [done, setDone] = useState(false)

  const pwValid = pwRules.every((r) => r.test(pw))

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
    if (!userid) {
      setUseridWarning("아이디를 입력해주세요.")
      setUseridShake(true)
      return
    }
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
    if (!verified) return
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
    setDone(true)
  }

  return (
    <Screen>
      <TopBar title="비밀번호 찾기" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={verified && !done ? <Button type="submit">비밀번호 변경</Button> : undefined}
        >
          {done ? (
            <div className="fade-up rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={26} aria-hidden />
              </span>
              <p className="mt-3 text-lg font-bold text-foreground">비밀번호가 변경되었습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">새 비밀번호로 로그인해 주세요.</p>
              <Button className="mt-6" onClick={() => navigate("/guardian/login")}>
                로그인하러 가기
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {verified ? "새 비밀번호를 설정해 주세요" : "가입 시 등록한 정보를 입력해 주세요"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {verified ? "안전한 비밀번호로 변경해 주세요." : "본인 확인 후 비밀번호를 재설정할 수 있습니다."}
                </p>
              </div>

              {!verified && (
                <>
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
                      {!codeWarning && (
                        <p className="mt-1.5 text-xs text-muted-foreground">데모 인증번호: {DEMO_CODE}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {verified && (
                <div className="fade-up space-y-5">
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
                      required
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
              )}
            </>
          )}
        </StickyAction>
      </form>
    </Screen>
  )
}
