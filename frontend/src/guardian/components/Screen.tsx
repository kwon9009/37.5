import { useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Bell, WifiOff } from "lucide-react"
import { cn } from "@/guardian/lib/utils"
import { captureInviteCode } from "@/guardian/lib/hospitals"

type ScreenProps = {
  children: ReactNode
  className?: string
}

/**
 * 인터넷 연결이 끊기면 화면 위에 안내를 띄운다.
 * 보호자 앱은 환자 상태를 실시간으로 받아야 해서, 연결이 끊긴 걸 모르고
 * 옛날 값을 계속 보고 있으면 위험하다. 그래서 눈에 띄게 막아준다.
 */
function OfflineNotice() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener("offline", goOffline)
    window.addEventListener("online", goOnline)
    return () => {
      window.removeEventListener("offline", goOffline)
      window.removeEventListener("online", goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-foreground/50 px-8"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
    >
      <div className="fade-up w-full rounded-3xl bg-card p-6 text-center shadow-xl">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
          <WifiOff size={28} aria-hidden />
        </span>
        <h2 id="offline-title" className="text-lg font-bold text-foreground">
          인터넷에 연결되어 있지 않습니다
        </h2>
        <p className="mt-2 text-balance break-keep text-sm leading-relaxed text-muted-foreground">
          환자분의 실시간 상태를 받아올 수 없습니다. Wi-Fi 또는 데이터 연결을 확인해 주세요.
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">연결되면 이 안내는 자동으로 사라집니다.</p>
      </div>
    </div>
  )
}

/** Centered mobile frame wrapper used by every screen. */
export function Screen({ children, className }: ScreenProps) {
  // 초대 링크(...?code=DJ001)로 들어왔다면 병원 코드를 저장해 둔다.
  // 모든 보호자 화면이 Screen 을 쓰므로, 어느 주소로 처음 들어와도 한 번은 잡힌다.
  useEffect(() => {
    captureInviteCode(window.location.search)
  }, [])

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-muted/40">
      {/* h-dvh + overflow-hidden: 바깥 스크롤을 없애 스크롤바가 상단 제목 칸(TopBar) 위로 겹치지 않게 함.
          실제 스크롤은 각 화면 내부의 overflow-y-auto 영역에서만 발생. */}
      {/* text-foreground: 병원용 전역 글자색(:root)을 물려받지 않도록 앱 프레임에서 보호자 색으로 고정.
          화면별로 className 에 text-* 를 주면 그 색이 우선한다(Splash/Emergency). */}
      <div
        className={cn(
          "app-shell relative flex h-dvh flex-col overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        {children}
        <OfflineNotice />
      </div>
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
            onClick={() => (onBellClick ? onBellClick() : navigate("/guardian/notifications"))}
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
