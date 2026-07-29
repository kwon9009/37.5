import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, FileText, LogOut, ChevronRight, VolumeX, Volume1, Volume2, X } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { patient } from "@/lib/data"
import { termsSections } from "@/lib/terms-content"

const soundLevels = [
  { key: "off", label: "무음", Icon: VolumeX },
  { key: "low", label: "작게", Icon: Volume1 },
  { key: "mid", label: "보통", Icon: Volume2 },
  { key: "high", label: "크게", Icon: Volume2 },
]

export default function Settings() {
  const navigate = useNavigate()
  const [sound, setSound] = useState("mid")
  const current = soundLevels.find((l) => l.key === sound) ?? soundLevels[2]

  // 이용약관 및 정책 - 회원가입 동의 화면과 별개로, 전문을 팝업으로 보여주기만 함
  const [termsOpen, setTermsOpen] = useState(false)

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
            onClick={() => navigate("/settings/account")}
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
            onClick={() => setTermsOpen(true)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40"
          >
            <FileText size={20} className="text-primary" aria-hidden />
            <span className="flex-1 font-medium text-foreground">이용약관 및 정책</span>
            <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
          </button>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-semibold text-danger hover:bg-danger/5"
        >
          <LogOut size={18} aria-hidden />
          로그아웃
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">버전 1.0.0</p>
      </div>
      <BottomNav />

      {/* 이용약관 및 정책 팝업 - 전문이 길어 팝업 내부에서만 스크롤됨 */}
      {termsOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4"
          onClick={() => setTermsOpen(false)}
        >
          <div
            className="fade-up flex h-[85%] w-full max-w-[26rem] flex-col rounded-t-3xl bg-card sm:h-[80%] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="이용약관 및 정책"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-lg font-bold text-foreground">이용약관 및 정책</h3>
              <button
                aria-label="닫기"
                onClick={() => setTermsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5">
                {termsSections.map((section) => (
                  <div key={section.heading}>
                    <h4 className="text-sm font-bold text-foreground">{section.heading}</h4>
                    <div className="mt-1.5 space-y-1.5">
                      {section.body.map((line, i) => (
                        <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}
