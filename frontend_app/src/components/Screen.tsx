import { useEffect, useRef, useState, type ReactNode } from "react"
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

type StickyActionProps = {
  children: ReactNode
  /** 하단에 고정될 액션 버튼 (예: "다음") */
  action: ReactNode
  /** 스크롤 영역 안쪽 여백/간격 클래스 */
  className?: string
}

/**
 * 스크롤 영역 + 하단 고정 액션 버튼 레이아웃 (모든 플로우 화면 공통 규칙).
 * - 액션 버튼은 항상 최상단 레이어에 떠 있어(overlay) 내용 위에 겹칩니다.
 * - 스크롤 내용은 하단 여백을 확보해 모든 요소를 버튼 바로 위까지 스크롤할 수 있습니다.
 * - 아직 아래에 가려진 내용이 있으면(끝까지 스크롤되지 않았으면) 버튼을 중간 정도 반투명 처리해
 *   뒤 내용을 확인하는 데 방해되지 않게 하고, 끝까지 스크롤하면 완전히 불투명해집니다.
 */
export function StickyAction({ children, action, className }: StickyActionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dim, setDim] = useState(false)

  function update() {
    const el = ref.current
    if (!el) return
    const canScroll = el.scrollHeight - el.clientHeight > 4
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    // 아래에 가려진 내용이 남아 있을 때만 버튼을 반투명 처리
    setDim(canScroll && !atBottom)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div ref={ref} onScroll={update} className={cn("flex-1 overflow-y-auto", className)}>
        {children}
        {/* 하단 버튼이 마지막 내용을 가리지 않도록 여백 확보 (버튼 바로 위까지 스크롤 가능) */}
        <div aria-hidden className="h-24" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5">
        <div
          className={cn(
            "pointer-events-auto transition-opacity duration-300",
            dim ? "opacity-60" : "opacity-100",
          )}
        >
          {action}
        </div>
      </div>
    </div>
  )
}

type TopBarProps = {
  title?: string
  back?: boolean
  bell?: boolean
  bellCount?: number
  /** 지정하지 않으면 기본 동작(알림 내역 페이지로 이동)을 사용 */
  onBellClick?: () => void
  right?: ReactNode
  logo?: boolean
}

export function TopBar({ title, back, bell, bellCount = 0, onBellClick, right, logo }: TopBarProps) {
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
            onClick={() => (onBellClick ? onBellClick() : navigate("/notifications"))}
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
