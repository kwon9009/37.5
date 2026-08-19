import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2, Check, ChevronDown } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import { apiClient, getErrorMessage } from "@/api/client.js"
import { useAuthStore } from "@/store/auth-store.js"
import "@/guardian/verify.css"

// 데모용 정답 인증번호 (실제 문자 발송 수단이 없어 화면 흐름만 재현한다)
// 화면에는 노출하지 않는다. 시연할 때는 이 값을 입력하면 된다.
const DEMO_CODE = "123456"

// 본인인증용 통신사 목록
const CARRIERS = ["SKT", "KT", "LG U+", "알뜰폰(SKT)", "알뜰폰(KT)", "알뜰폰(LG U+)"]

const pwRules = [
  { key: "letter", label: "영문(대/소문자)", test: (v: string) => /[a-zA-Z]/.test(v) },
  { key: "digit", label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
  { key: "special", label: "특수기호", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function Signup() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  // 인증 상태
  const [phoneSent, setPhoneSent] = useState(false)
  const [code, setCode] = useState("")
  const [codeWarning, setCodeWarning] = useState("")
  const [codeShake, setCodeShake] = useState(false)
  const [verified, setVerified] = useState(false)

  // 성명 상태 (완성 한글만)
  const [name, setName] = useState("")
  const [nameWarning, setNameWarning] = useState("")
  const [nameShake, setNameShake] = useState(false)

  // 통신사 상태 (토글로 목록을 아래로 펼쳐서 선택)
  const [carrier, setCarrier] = useState("")
  const [carrierOpen, setCarrierOpen] = useState(false)
  const [carrierWarning, setCarrierWarning] = useState("")

  // 연락처 상태 (010-XXXX-XXXX)
  const [phone, setPhone] = useState("")
  const [phoneWarning, setPhoneWarning] = useState("")
  const [phoneShake, setPhoneShake] = useState(false)

  // 이메일 상태 (비밀번호 찾기·응급 알림 대체 수단)
  const [email, setEmail] = useState("")
  const [emailWarning, setEmailWarning] = useState("")
  const [emailShake, setEmailShake] = useState(false)

  // 아이디 상태 (중복검사)
  const [userid, setUserid] = useState("")
  const [useridStatus, setUseridStatus] = useState<"idle" | "ok" | "taken" | "invalid" | "empty">("idle")
  const [useridShake, setUseridShake] = useState(false)
  const [useridChecking, setUseridChecking] = useState(false)

  // 비밀번호 상태
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwShake, setPwShake] = useState(false)
  const [pwWarning, setPwWarning] = useState("")

  // 가입 요청 상태
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const pwValid = pwRules.every((r) => r.test(pw))

  // 성명: 미입력 시 안내, 완성된 한글(가-힣)만 허용. 자모/영문/숫자 포함 시 진동 + 삭제
  function handleNameBlur() {
    if (!name) {
      setNameWarning("성명을 입력해주세요.")
      // 다른 오류(형식 오류·연락처·아이디)와 동일하게 흔들림 모션으로 알림
      setNameShake(true)
      return
    }
    if (!/^[가-힣]{2,}$/.test(name)) {
      setNameWarning("정확한 성명을 입력해 주세요.")
      setNameShake(true)
      setName("")
    } else {
      setNameWarning("")
    }
  }

  // 연락처: 입력 중 자동으로 010-XXXX-XXXX 형태로 포맷
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

  // 연락처: 형식 불충족 시 진동 + 삭제
  function handlePhoneBlur() {
    if (phone && !/^010-\d{4}-\d{4}$/.test(phone)) {
      setPhoneWarning("010-XXXX-XXXX 형태로 입력해 주세요.")
      setPhoneShake(true)
      setPhone("")
    } else {
      setPhoneWarning("")
    }
  }

  // 아이디: 중복검사 (형식 검사 + 서버에 사용 여부 확인)
  // 규칙: 영문과 숫자를 모두 포함, 최소 6자 이상
  async function handleUseridCheck() {
    if (!/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,20}$/.test(userid)) {
      setUseridStatus("invalid")
      setUseridShake(true)
      return
    }

    setUseridChecking(true)
    try {
      const { data } = await apiClient.get("/auth/check-login-id", { params: { login_id: userid } })
      if (data.available) {
        setUseridStatus("ok")
      } else {
        setUseridStatus("taken")
        setUseridShake(true)
        setUserid("")
      }
    } catch {
      // 서버에 못 물어봤으면 '사용 가능'으로 넘기면 안 된다.
      // 가입 단계에서 어차피 한 번 더 막히므로 여기서는 확인만 실패로 둔다.
      setUseridStatus("idle")
      setSubmitError("아이디 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      setUseridChecking(false)
    }
  }

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

  // 미입력 검사는 브라우저 기본 말풍선("이 입력란을 작성하세요") 대신
  // 화면 위에서 아래 순서대로 앱 경고 문구를 띄운다. 그래서 input 에 required 를 쓰지 않는다.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")
    // 성명 미입력 시 안내 문구 표시
    if (!name) {
      setNameWarning("성명을 입력해주세요.")
      setNameShake(true)
      return
    }
    if (!carrier) {
      setCarrierWarning("통신사를 선택해 주세요.")
      setCarrierOpen(true)
      return
    }
    if (!phone) {
      setPhoneWarning("연락처를 입력해주세요.")
      setPhoneShake(true)
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
    if (!userid) {
      setUseridStatus("empty")
      setUseridShake(true)
      return
    }
    if (!pw || !pw2) {
      setPwWarning("비밀번호를 입력해주세요.")
      setPwShake(true)
      return
    }
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

    // 여기서부터 실제 가입. 성공하면 바로 로그인까지 해서
    // 환자 등록 화면에서 다시 로그인하라고 하지 않는다.
    setSubmitting(true)
    try {
      await apiClient.post("/auth/register/guardian", {
        login_id: userid,
        email,
        password: pw,
        name,
        phone,
      })

      const { data } = await apiClient.post("/auth/login", {
        login_id: userid,
        password: pw,
      })

      login(
        {
          accessToken: data.access_token,
          userId: data.user_id,
          role: data.role,
          loginId: userid,
        },
        false,
      )

      navigate("/guardian/patient-info", { replace: true })
    } catch (err) {
      setSubmitError(getErrorMessage(err, "회원가입 중 오류가 발생했습니다."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <TopBar title="회원가입" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction
          className="space-y-5 px-5 py-6"
          action={
            <Button type="submit" disabled={submitting}>
              {submitting ? "가입 중..." : "다음"}
            </Button>
          }
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">계정 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">보호자 본인 인증 후 계정을 생성합니다.</p>
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
              onBlur={handleNameBlur}
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

          {/* 통신사 - 토글을 누르면 목록이 아래로 펼쳐지고, 항목을 누르면 선택되고 닫힘 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">통신사</span>
            <button
              type="button"
              onClick={() => setCarrierOpen((s) => !s)}
              aria-expanded={carrierOpen}
              aria-haspopup="listbox"
              className={cn(
                "flex h-13 w-full items-center justify-between rounded-2xl border px-4 text-base transition",
                carrierOpen ? "border-primary bg-primary/10" : "border-input bg-card",
                carrier ? "text-foreground" : "text-muted-foreground/60",
                carrierWarning && "verify-error-border",
              )}
            >
              {/* 선택 전 안내 문구는 진짜 placeholder 가 아니라 span 이므로,
                  다른 칸의 자리표시 문구와 같은 크기(14px)로 직접 맞춰준다 */}
              <span className={cn("truncate", !carrier && "text-sm")}>{carrier || "통신사를 선택하세요"}</span>
              <ChevronDown
                size={18}
                className={cn(
                  "ml-2 shrink-0 text-muted-foreground transition-transform",
                  carrierOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {carrierOpen && (
              <ul
                role="listbox"
                aria-label="통신사 선택"
                className="fade-up mt-2 overflow-hidden rounded-2xl border border-border bg-card"
              >
                {CARRIERS.map((c) => {
                  const selected = c === carrier
                  return (
                    <li key={c}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setCarrier(c)
                          setCarrierOpen(false)
                          setCarrierWarning("")
                        }}
                        className={cn(
                          "flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left text-base transition last:border-b-0",
                          selected ? "bg-primary/10 font-semibold text-foreground" : "text-foreground hover:bg-muted",
                        )}
                      >
                        {c}
                        {selected && <Check size={16} strokeWidth={3} className="text-success" aria-hidden />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {carrierWarning && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                {carrierWarning}
              </p>
            )}
          </div>

          {/* 연락처 + 인증번호 발급 */}
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
              />
              <Button
                type="button"
                variant="outline"
                className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                onClick={() => {
                  // 통신사는 본인인증에 필요하므로 발급 전에 선택돼 있어야 함
                  if (!carrier) {
                    setCarrierWarning("통신사를 선택해 주세요.")
                    setCarrierOpen(true)
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
                }}
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
                    "verify-code-input h-13 min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-60",
                    codeWarning && "verify-error-border",
                    codeShake && "verify-shake",
                  )}
                />
                <Button
                  type="button"
                  variant={verified ? "muted" : "primary"}
                  className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
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
            </div>
          )}

          <div className="h-px bg-border" />

          {/* 이메일 (비밀번호 찾기·응급 알림 대체 수단) */}
          <div>
            <Field
              id="email"
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailWarning("")
              }}
              onAnimationEnd={() => setEmailShake(false)}
              className={cn(emailShake && "verify-shake", emailWarning && "verify-error-border")}
            />
            {emailWarning ? (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                {emailWarning}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                비밀번호를 잊었을 때와 긴급 알림 전달에 사용됩니다.
              </p>
            )}
          </div>

          {/* 아이디 + 중복검사 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">아이디</span>
            <div className="flex w-full items-stretch gap-2">
              <input
                id="userid"
                placeholder="아이디를 입력하세요"
                aria-label="아이디"
                className={cn(
                  "h-13 min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20",
                  useridShake && "verify-shake",
                  (useridStatus === "taken" || useridStatus === "invalid") && "verify-error-border",
                )}
                value={userid}
                onChange={(e) => {
                  setUserid(e.target.value)
                  setUseridStatus("idle")
                }}
                onAnimationEnd={() => setUseridShake(false)}
              />
              <Button
                type="button"
                variant={useridStatus === "ok" ? "muted" : "primary"}
                className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                disabled={useridStatus === "ok" || useridChecking}
                onClick={handleUseridCheck}
              >
                {useridStatus === "ok" ? "확인됨" : useridChecking ? "확인 중" : "중복검사"}
              </Button>
            </div>
            {useridStatus === "empty" && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                아이디를 입력해주세요.
              </p>
            )}
            {useridStatus === "invalid" && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                아이디는 영문과 숫자를 모두 포함해 6자 이상으로 입력해 주세요.
              </p>
            )}
            {useridStatus === "taken" && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                이미 사용 중인 아이디입니다. 다시 입력해 주세요.
              </p>
            )}
            {useridStatus === "ok" && (
              <p className="verify-success">
                <CheckCircle2 size={14} aria-hidden />
                사용 가능한 아이디입니다.
              </p>
            )}
          </div>

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
            />
            {pwWarning && (
              <p className="verify-warning" role="alert">
                <AlertCircle size={14} aria-hidden />
                {pwWarning}
              </p>
            )}
          </div>

          {/* 서버가 거부한 경우(아이디·이메일 중복 등) */}
          {submitError && (
            <p className="verify-warning" role="alert">
              <AlertCircle size={14} aria-hidden />
              {submitError}
            </p>
          )}
        </StickyAction>
      </form>
    </Screen>
  )
}
