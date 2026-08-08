import { useNavigate } from "react-router-dom"
import { Phone, PhoneCall, Briefcase, Users } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"

// 심박수·호흡수 이상 응급 대응 - 보호자는 환자와 떨어져 있고,
// 병력·생체신호는 상주 의료진이 이미 파악·대응 중이므로
// 보호자만 할 수 있는 조치(사실 확인, 방문 준비, 가족 공유)에 집중하도록 구성.
// 각 단계에 픽토그램(아이콘)을 넣어 직관적으로 안내.
const steps = [
  {
    Icon: PhoneCall,
    label: "사실 확인",
    title: "요양병원에 연락해 응급 상황을 확인하세요",
    body: "병원에 전화해 실제 상황과 환자 상태를 확인하세요. 상주 의료진이 이미 대응 중이니, 침착하게 현재 상태와 필요한 조치를 안내받으세요.",
  },
  {
    Icon: Briefcase,
    label: "방문 준비",
    title: "병원 방문이 필요한지 확인하고 준비하세요",
    body: "의료진 안내에 따라 직접 방문이 필요하면 신분증, 건강보험증 등을 챙겨 이동을 준비하세요.",
  },
  {
    Icon: Users,
    label: "가족에게 알리기",
    title: "다른 가족에게 상황을 알리고 연락 가능한 상태를 유지하세요",
    body: "추가 안내나 상황 변화에 대비해 휴대폰을 곁에 두고, 필요하다면 다른 가족에게도 상황을 공유하세요.",
  },
]

export default function EmergencyGuide() {
  const navigate = useNavigate()

  return (
    <Screen>
      <TopBar title="의료 응급상황 대응 가이드" back titleClassName="text-sm" />
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
