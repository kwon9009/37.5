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
    <div className="flex h-dvh justify-center overflow-hidden bg-muted/40">
      {/* h-dvh + overflow-hidden: 바깥 스크롤을 없애 스크롤바가 상단 제목 칸(TopBar) 위로 겹치지 않게 함.
          실제 스크롤은 각 화면 내부의 overflow-y-auto 영역에서만 발생. */}
      <div className={cn("app-shell flex h-dvh flex-col overflow-hidden bg-background", className)}>{children}</div>
    </div>
  )
}

type TopBarProps = {
  title?: string
  back?: boolean
  bell?: boolean
  bellCount?: number
  right?: ReactNode
  logo?: boolean
}

export function TopBar({ title, back, bell, bellCount = 0, right, logo }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 px-2 backdrop-blur">
      <div className="flex w-12 items-center justify-start">
        {back ? (
          <button
            aria-label="뒤로 가기"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-muted"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        ) : (
          logo && (
            <img
              src="/images/37-5-logo.png"
              alt="37.5°C 로고"
              className="ml-1 h-9 w-9 object-contain"
            />
          )
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
