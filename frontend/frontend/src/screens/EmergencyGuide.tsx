import { useNavigate } from "react-router-dom"
import { Phone } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { patient } from "@/lib/data"

const steps = [
  {
    title: "환자에게 말을 걸어 의식을 확인하세요",
    body: "어깨를 가볍게 두드리며 이름을 부르고 반응이 있는지 확인합니다. 무리하게 흔들지 마세요.",
  },
  {
    title: "환자를 함부로 일으키지 마세요",
    body: "골절이나 부상이 의심되면 움직이지 않도록 하고, 편안한 자세를 유지하도록 도와주세요.",
  },
  {
    title: "출혈·통증 부위를 살펴보세요",
    body: "머리·허리·엉덩이 부위의 통증과 출혈 여부를 확인합니다. 출혈이 있다면 깨끗한 천으로 눌러주세요.",
  },
  {
    title: "병원 또는 119에 즉시 연락하세요",
    body: "의식이 없거나 심한 통증·출혈이 있는 경우 지체 없이 연락하여 상황을 전달합니다.",
  },
]

export default function EmergencyGuide() {
  const navigate = useNavigate()
  return (
    <Screen>
      <TopBar title="낙상 대응 가이드" back />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-3xl bg-danger/10 p-5">
          <p className="text-sm font-semibold text-danger">낙상 시 응급 사항</p>
          <p className="mt-1 text-balance leading-relaxed text-foreground">
            {patient.name} 님의 낙상이 감지되었습니다. 아래 순서에 따라 침착하게 대응해 주세요.
          </p>
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-2xl bg-muted/60 p-4">
          <p className="text-sm font-semibold text-foreground">환자 특이사항</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            고혈압 병력이 있어 급격한 자세 변화에 주의가 필요합니다. 복용 약물 정보는 병원에 문의해 주세요.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border bg-card px-5 py-4">
        <a
          href="tel:0000000000"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-danger-foreground"
        >
          <Phone size={20} aria-hidden />
          병원 연락하기
        </a>
        <button
          onClick={() => navigate("/home")}
          className="h-12 w-full text-sm font-medium text-muted-foreground"
        >
          홈화면으로
        </button>
      </div>
    </Screen>
  )
}
