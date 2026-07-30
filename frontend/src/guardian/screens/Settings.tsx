import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, FileText, LogOut, ChevronRight, ChevronDown, VolumeX, Volume1, Volume2, CheckCircle2 } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { BottomNav } from "@/guardian/components/BottomNav"
import { cn } from "@/guardian/lib/utils"
import { useGuardianData } from "@/guardian/lib/api"
import { useAuthStore } from "@/store/auth-store.js"

const soundLevels = [
  { key: "off", label: "무음", Icon: VolumeX },
  { key: "low", label: "작게", Icon: Volume1 },
  { key: "mid", label: "보통", Icon: Volume2 },
  { key: "high", label: "크게", Icon: Volume2 },
]

type Choice = "yes" | "no"

// 회원가입 전 약관 동의(Terms)와 동일한 예/아니오 재동의 블록
function ConsentRow({
  required,
  title,
  body,
  restriction,
  value,
  onChange,
}: {
  required?: boolean
  title: string
  body: string
  restriction: string
  value: Choice
  onChange: (c: Choice) => void
}) {
  // 약관 제목을 누르면 본문이 아래로 펼쳐짐 (PatientInfo의 확장 토글 방식과 동일)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            required ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary",
          )}
        >
          {required ? "필수" : "선택"}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" aria-hidden />
        )}
      </button>

      {/* 약관 본문 - 내용이 길 수 있어 패널 내부에서만 스크롤되게 함 */}
      {open && (
        <div className="max-h-40 overflow-y-auto rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <p>{body}</p>
          <p className="mt-2 text-muted-foreground/80">{restriction}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onChange("yes")}
          className={cn(
            "h-10 flex-1 rounded-xl border text-sm font-semibold transition",
            value === "yes" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
          )}
        >
          동의
        </button>
        <button
          onClick={() => onChange("no")}
          className={cn(
            "h-10 flex-1 rounded-xl border text-sm font-semibold transition",
            value === "no" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
          )}
        >
          비동의
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const { patient } = useGuardianData()
  const [sound, setSound] = useState("mid")
  const current = soundLevels.find((l) => l.key === sound) ?? soundLevels[2]

  // 이용약관 및 정책 재동의 (가입 시 동의한 상태로 시작)
  const [termsOpen, setTermsOpen] = useState(false)
  const [requiredConsent, setRequiredConsent] = useState<Choice>("yes")
  const [optionalConsent, setOptionalConsent] = useState<Choice>("yes")
  const [savedMsg, setSavedMsg] = useState("")

  return (
    <Screen>
      <TopBar title="설정" logo />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Guardian profile */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <User size={26} aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">{patient.guardian}</p>
            <p className="text-sm text-muted-foreground">
              보호자 · {patient.name} 님의 {patient.relation}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <button
            onClick={() => navigate("/guardian/settings/account")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40"
          >
            <User size={20} className="text-primary" aria-hidden />
            <span className="flex-1 font-medium text-foreground">계정 정보 수정</span>
            <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
          </button>
          <div className="h-px bg-border" />
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <current.Icon size={20} className="text-primary" aria-hidden />
              <span className="flex-1 font-medium text-foreground">알림 소리</span>
              <span className="text-sm font-semibold text-primary">{current.label}</span>
            </div>
            <div
              role="radiogroup"
              aria-label="알림 소리 단계"
              className="mt-3 flex gap-1.5 rounded-2xl bg-muted p-1"
            >
              {soundLevels.map((level) => {
                const active = sound === level.key
                return (
                  <button
                    key={level.key}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSound(level.key)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition ${
                      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {level.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="h-px bg-border" />
          <button
            onClick={() => {
              setTermsOpen((o) => !o)
              setSavedMsg("")
            }}
            aria-expanded={termsOpen}
            className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40"
          >
            <FileText size={20} className="text-primary" aria-hidden />
            <span className="flex-1 font-medium text-foreground">이용약관 및 정책</span>
            {termsOpen ? (
              <ChevronDown size={18} className="text-muted-foreground" aria-hidden />
            ) : (
              <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
            )}
          </button>
          {termsOpen && (
            <div className="space-y-4 border-t border-border bg-muted/30 px-5 py-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                이용약관 및 정책에 대한 동의 여부를 다시 선택할 수 있습니다. 필수 항목에 비동의 시 서비스 이용이 불가능합니다.
              </p>
              <ConsentRow
                required
                title="사용자 정보 보관에 대한 사항"
                body="사용자 및 환자의 생체신호·계정 정보를 안전하게 보관하고 모니터링 목적에 한해 활용합니다."
                restriction="거부 시 서비스 이용이 불가능합니다."
                value={requiredConsent}
                onChange={(c) => {
                  // 필수 항목 비동의 시 실제 값은 바꾸지 않고 로그인 화면으로 이동
                  if (c === "no") {
                    logout()
                    navigate("/guardian/login")
                    return
                  }
                  setRequiredConsent(c)
                  setSavedMsg("")
                }}
              />
              <ConsentRow
                title="이벤트 정보 수집 (선택)"
                body="서비스 개선 및 맞춤 알림을 위한 이용 이벤트 정보를 수집합니다."
                restriction="거부 시 서비스 최적화에 제약이 있을 수 있습니다."
                value={optionalConsent}
                onChange={(c) => {
                  setOptionalConsent(c)
                  setSavedMsg("")
                }}
              />
              <button
                onClick={() =>
                  setSavedMsg(
                    requiredConsent === "no"
                      ? "필수 항목에 비동의하여 일부 서비스 이용이 제한됩니다."
                      : "동의 설정이 저장되었습니다.",
                  )
                }
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                변경 사항 저장
              </button>
              {savedMsg && (
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    requiredConsent === "no" ? "text-danger" : "text-success",
                  )}
                  role="status"
                >
                  <CheckCircle2 size={14} aria-hidden />
                  {savedMsg}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            logout()
            navigate("/guardian/login")
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-semibold text-danger hover:bg-danger/5"
        >
          <LogOut size={18} aria-hidden />
          로그아웃
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">버전 1.0.0</p>
      </div>
      <BottomNav />
    </Screen>
  )
}
