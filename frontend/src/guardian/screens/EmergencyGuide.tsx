import { useNavigate } from "react-router-dom"
import { Phone, Stethoscope, BedDouble, Activity } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"

// 심박수·호흡수 이상 응급 대응 - 보호자 관점
// 요양병원 상주 의료진이 1차 대응하므로, 보호자는 원격에서
// 환자 상태 확인과 생체신호 관찰에 집중하도록 구성.
// 각 단계에 픽토그램(아이콘)을 넣어 직관적으로 안내.
const steps = [
  {
    Icon: Stethoscope,
    label: "의식·호흡 확인",
    title: "환자의 호흡과 의식 상태를 확인하세요",
    body: "말을 걸어 반응을 확인하고, 가슴 움직임으로 호흡이 원활한지 살펴보세요. 안색이나 입술이 창백하거나 청색을 띠는지도 확인합니다.",
  },
  {
    Icon: BedDouble,
    label: "안정 자세",
    title: "환자를 편안한 자세로 안정시키세요",
    body: "상체를 약간 세운 자세로 눕히고 목과 가슴을 조이는 옷은 풀어주세요. 무리하게 움직이지 않도록 안정을 취하게 합니다.",
  },
  {
    Icon: Activity,
    label: "생체신호 관찰",
    title: "실시간 생체신호를 지속적으로 관찰하세요",
    body: "심박수·호흡수가 정상 범위로 돌아오는지 확인하고, 증상이 악화되면 즉시 119에 신고하거나 병원에 재연락하세요.",
  },
]

export default function EmergencyGuide() {
  const navigate = useNavigate()

  return (
    <Screen>
      <TopBar title="의료 응급상황 대응 가이드" back />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* 1·2·3단계 대응을 픽토그램으로 요약 */}
        <div className="rounded-3xl bg-danger/10 p-5">
          <div className="grid grid-cols-3 gap-3">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-card text-danger shadow-sm">
                  <s.Icon size={26} aria-hidden />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-danger text-[11px] font-bold text-danger-foreground">
                    {i + 1}
                  </span>
                </span>
                <span className="mt-2 text-xs font-semibold leading-tight text-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 단계별 대응 (픽토그램 포함) */}
        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <s.Icon size={22} aria-hidden />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="shrink-0 space-y-3 border-t border-border bg-card px-5 py-4">
        <a
          href="tel:0000000000"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-danger-foreground"
        >
          <Phone size={20} aria-hidden />
          병원 연락하기
        </a>
        <button
          onClick={() => navigate("/guardian/emergency")}
          className="h-12 w-full text-sm font-medium text-muted-foreground"
        >
          돌아가기
        </button>
      </div>
    </Screen>
  )
}
