/**
 * "홈 화면에 앱으로 설치" 도우미.
 *
 * 안드로이드 크롬은 설치 가능한 상태가 되면 `beforeinstallprompt` 이벤트를 딱 한 번
 * 던진다. 이 이벤트는 화면이 그려지기 전에 올 수도 있어서, React 안에서 듣기 시작하면
 * 놓친다. 그래서 이 파일을 앱 시작(main.jsx)에서 바로 불러 이벤트를 잡아 둔다.
 *
 * 아이폰(사파리)에는 이 이벤트가 없다. "공유 → 홈 화면에 추가"를 직접 안내해야 한다.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // 기본 설치 배너를 막고, 우리가 원하는 순간(초대 화면의 설치 버튼)에 띄운다
    event.preventDefault()
    deferred = event as InstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    notify()
  })
}

/** 설치 버튼을 보여줘도 되는 상태인지 */
export function canInstall(): boolean {
  return deferred !== null
}

/** 설치 가능 여부가 바뀌면 알려준다. 반환값을 호출하면 구독 해제. */
export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** 설치 창을 띄운다. 이벤트를 못 받은 환경이면 "unavailable". */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable"
  const event = deferred
  deferred = null // 같은 이벤트는 두 번 못 쓴다
  notify()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

/** 이미 홈 화면 아이콘(웹앱)으로 실행 중인지 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true
}

/** 아이폰·아이패드 여부 (설치 방법 안내 문구가 다르다) */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  // 아이패드OS 는 데스크톱 사파리처럼 보고하므로 터치 지원 여부로 함께 판단한다
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}
