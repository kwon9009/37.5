import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

type ScreenProps = {
  children: ReactNode
  className?: string
}

/** Centered mobile frame wrapper used by every screen. */
export function Screen({ children, className }: ScreenProps) {
  return (
    <div className="flex min-h-dvh justify-center bg-muted/40">
      <div className={cn("app-shell flex min-h-dvh flex-col bg-background", className)}>{children}</div>
    </div>
  )
}

type TopBarProps = {
  title?: string
  back?: boolean
  bell?: boolean
  bellCount?: number
  right?: ReactNode
}

export function TopBar({ title, back, bell, bellCount = 0, right }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 px-2 backdrop-blur">
      <div className="flex w-12 justify-start">
        {back && (
          <button
            aria-label="뒤로 가기"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-muted"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        )}
      </div>
      <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
      <div className="flex w-12 justify-end">
        {right}
        {bell && (
          <button
            aria-label="알림"
            onClick={() => navigate("/notifications")}
            className="relative grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-muted"
          >
            <Bell size={22} aria-hidden />
            {bellCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                {bellCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
