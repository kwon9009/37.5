import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, FileText, LogOut, ChevronRight, VolumeX, Volume1, Volume2 } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { patient } from "@/lib/data"

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
          <button className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40">
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
    </Screen>
  )
}
