import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Bell, FileText, LogOut, ChevronRight } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { patient } from "@/lib/data"

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState(true)

  return (
    <Screen>
      <TopBar title="설정" />
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
          <div className="flex w-full items-center gap-3 px-5 py-4">
            <Bell size={20} className="text-primary" aria-hidden />
            <span className="flex-1 font-medium text-foreground">알림 설정</span>
            <Toggle on={alerts} onChange={setAlerts} />
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
