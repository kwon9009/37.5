import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CheckCircle2, Check, ChevronDown } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import "@/guardian/verify.css"

// 데모용 정답 인증번호
const DEMO_CODE = "123456"

// 데모용 이미 사용 중인 아이디
const TAKEN_IDS = ["admin", "test", "user123", "hong", "guardian"]

// 본인인증용 통신사 목록
const CARRIERS = ["SKT", "KT", "LG U+", "알뜰폰(SKT)", "알뜰폰(KT)", "알뜰폰(LG U+)"]

const pwRules = [
  { key: "letter", label: "영문(대/소문자)", test: (v: string) => /[a-zA-Z]/.test(v) },
  { key: "digit", label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
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

  // 아이디 상태 (중복검사)
  const [userid, setUserid] = useState("")
  const [useridStatus, setUseridStatus] = useState<"idle" | "ok" | "taken" | "invalid">("idle")
  const [useridShake, setUseridShake] = useState(false)

  // 비밀번호 상태
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwShake, setPwShake] = useState(false)
  const [pwWarning, setPwWarning] = useState("")

  const pwValid = pwRules.every((r) => r.test(pw))

  // 성명: 미입력 시 안내, 완성된 한글(가-힣)만 허용. 자모/영문/숫자 포함 시 진동 + 삭제
  function handleNameBlur() {
    if (!name) {
      setNameWarning("성명을 입력해주세요.")
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

  // 아이디: 중복검사 (형식 검사 + 사용 여부 확인)
  // 규칙: 영문과 숫자를 모두 포함, 최소 6자 이상
  function handleUseridCheck() {
    if (!/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,20}$/.test(userid)) {
      setUseridStatus("invalid")
      setUseridShake(true)
      return
    }
    if (TAKEN_IDS.includes(userid.toLowerCase())) {
      setUseridStatus("taken")
      setUseridShake(true)
      setUserid("")
      return
    }
    setUseridStatus("ok")
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 성명 미입력 시 안내 문구 표시
    if (!name) {
      setNameWarning("성명을 입력해주세요.")
      setNameShake(true)
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
    navigate("/guardian/patient-info")
  }

  return (
    <Screen>
      <TopBar title="회원가입" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction className="space-y-5 px-5 py-6" action={<Button type="submit">다음</Button>}>
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
                required
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
              {!verified && !codeWarning && (
                <p className="mt-1.5 text-xs text-muted-foreground">데모 인증번호: {DEMO_CODE}</p>
              )}
            </div>
          )}

          <div className="h-px bg-border" />

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
                required
              />
              <Button
                type="button"
                variant={useridStatus === "ok" ? "muted" : "primary"}
                className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                disabled={useridStatus === "ok"}
                onClick={handleUseridCheck}
              >
                {useridStatus === "ok" ? "확인됨" : "중복검사"}
              </Button>
            </div>
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
        </StickyAction>
      </form>
    </Screen>
  )
}
