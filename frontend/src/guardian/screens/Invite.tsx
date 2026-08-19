import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Check, MapPin, Share, SquarePlus, Smartphone } from "lucide-react"
import { Screen } from "@/guardian/components/Screen"
import { Button } from "@/guardian/components/ui"
import { fetchHospitalByCode, getInviteCode, type HospitalInfo } from "@/guardian/lib/hospitals"
import { canInstall, isIos, isStandalone, promptInstall, subscribeInstall } from "@/guardian/lib/pwa-install"

/**
 * 문자로 받은 초대 링크가 열리는 첫 화면 (`/guardian/invite?k=…`).
 *
 * 하는 일은 세 가지다.
 *  1. 주소의 토큰을 풀어 병원 코드를 꺼내 저장한다(가입 화면에서 자동으로 채워짐).
 *  2. 어느 병원이 보낸 초대인지 보여준다.
 *  3. "홈 화면에 앱으로 설치"를 안내한다. 설치해야 알림·전체화면 같은
 *     앱다운 동작이 되고, 다음부터는 아이콘만 눌러 바로 들어올 수 있다.
 *
 * 이미 웹앱으로 실행 중이면 안내가 필요 없으므로 곧장 시작 화면으로 넘어간다.
 */
export default function Invite() {
  const navigate = useNavigate()

  // 주소의 토큰(?k=)을 풀어 얻은 병원 코드. 링크가 깨졌으면 null.
  const [code] = useState(() => getInviteCode())
  const [hospital, setHospital] = useState<HospitalInfo | null>(null)

  const [installable, setInstallable] = useState(canInstall())
  const [installed, setInstalled] = useState(false)
  const standalone = isStandalone()
  const ios = isIos()

  // 이미 앱으로 실행 중이면 안내 화면을 건너뛴다
  useEffect(() => {
    if (standalone) navigate("/guardian", { replace: true })
  }, [standalone, navigate])

  // 설치 가능 여부는 브라우저가 나중에 알려줄 수 있어 구독해 둔다
  useEffect(() => subscribeInstall(() => setInstallable(canInstall())), [])

  // 병원 이름을 보여줘 "내가 아는 그 병원이 보낸 링크"임을 확인시켜 준다
  useEffect(() => {
    if (!code) return
    let alive = true
    fetchHospitalByCode(code).then((found) => {
      if (alive) setHospital(found)
    })
    return () => {
      alive = false
    }
  }, [code])

  async function handleInstall() {
    const result = await promptInstall()
    if (result === "accepted") setInstalled(true)
  }

  return (
    <Screen>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-10">
        <div className="flex flex-col items-center text-center">
          <img src="/images/37-5-logo.png" alt="" className="h-20 w-20 object-contain" aria-hidden />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">37.5°C</h1>
          <p className="mt-1 text-sm font-semibold text-accent">보호자용 환자 모니터링 앱</p>
          <p className="mt-3 text-balance break-keep text-sm leading-relaxed text-muted-foreground">
            {hospital ? <b className="text-foreground">{hospital.name}</b> : "병원"}에서 보호자님을 초대했습니다.
            환자분의 심박수·호흡수를 24시간 지켜보고, 이상이 감지되면 즉시 알려드립니다.
          </p>
        </div>

        {/* 어느 병원이 보낸 초대인지 */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-5">
          {hospital ? (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Building2 size={20} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">초대한 병원 · 환자분이 계신 곳</p>
                <p className="truncate font-bold text-foreground">{hospital.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} aria-hidden />
                  {hospital.address}
                </p>
              </div>
            </div>
          ) : code ? (
            <p className="text-sm text-muted-foreground">병원 정보를 불러오는 중입니다…</p>
          ) : (
            <p className="text-balance break-keep text-sm leading-relaxed text-muted-foreground">
              링크가 올바르지 않아 병원을 확인하지 못했습니다. 가입 도중 병원에서 안내받은 코드를 직접
              입력하시면 됩니다.
            </p>
          )}

          {code && (
            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-medium text-success">
              <Check size={14} aria-hidden />
              병원 코드가 자동으로 입력됩니다
            </p>
          )}
        </div>

        {/* 설치 안내: 안드로이드는 버튼 한 번, 아이폰은 공유 메뉴 안내 */}
        <div className="mt-4 rounded-3xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Smartphone size={18} className="text-primary" aria-hidden />
            37.5°C를 홈 화면에 추가하세요
          </p>

          {installed ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              추가했습니다. 홈 화면의 <b className="text-foreground">37.5°C</b> 아이콘을 누르면 앱처럼
              전체화면으로 열립니다.
            </p>
          ) : ios ? (
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <Share size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>
                  아래쪽 <b className="text-foreground">공유</b> 버튼을 누릅니다.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <SquarePlus size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>
                  메뉴에서 <b className="text-foreground">홈 화면에 추가</b>를 고릅니다.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>
                  홈 화면에 생긴 <b className="text-foreground">37.5°C</b> 아이콘으로 앱을 엽니다.
                </span>
              </li>
            </ol>
          ) : installable ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                버튼을 누르면 홈 화면에 <b className="text-foreground">37.5°C</b> 아이콘이 생깁니다.
                다음부터는 아이콘만 눌러 바로 들어오고, 응급 알림도 앱으로 받습니다.
              </p>
              <Button className="mt-4" onClick={handleInstall}>
                37.5°C 홈 화면에 추가
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              브라우저 메뉴(⋮)에서 <b className="text-foreground">앱 설치</b> 또는{" "}
              <b className="text-foreground">홈 화면에 추가</b>를 누르면 앱처럼 실행됩니다.
            </p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Button variant={installable && !installed && !ios ? "outline" : "primary"} onClick={() => navigate("/guardian", { replace: true })}>
            37.5°C 시작하기
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            홈 화면에 추가하지 않고 지금 가입해도 됩니다. 나중에 추가해도 하던 곳부터 그대로 이어집니다.
          </p>
        </div>
      </div>
    </Screen>
  )
}
