import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Bell, Trash2 } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { useGuardianData } from "@/guardian/lib/api"

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications } = useGuardianData()
  const [items, setItems] = useState(notifications)
  useEffect(() => setItems(notifications), [notifications])

  return (
    <Screen>
      <TopBar
        title="알림 내역"
        back
        right={
          items.length > 0 ? (
            <button
              onClick={() => setItems([])}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <Trash2 size={14} aria-hidden />
              비우기
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {items.length > 0 && (
          <p className="mb-3 text-sm text-muted-foreground">{items.length}개의 알림</p>
        )}
        <ul className="space-y-2">
          {items.map((n) => {
            const urgent = n.type === "urgent"
            return (
              <li key={n.id}>
                <button
                  onClick={() => urgent && navigate("/guardian/emergency")}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${
                    urgent ? "border-danger/30 bg-danger/5" : "border-border bg-card"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      urgent ? "bg-danger/15 text-danger" : "bg-muted text-primary"
                    }`}
                  >
                    {urgent ? <AlertTriangle size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${urgent ? "text-danger" : "text-foreground"}`}
                    >
                      {urgent ? "긴급 알림" : "일반 알림"}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-foreground">{n.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{n.time}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <Bell size={26} aria-hidden />
            </span>
            <p className="font-medium text-foreground">새로운 알림이 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">알림이 도착하면 이곳에 표시됩니다.</p>
          </div>
        )}
      </div>
    </Screen>
  )
}
