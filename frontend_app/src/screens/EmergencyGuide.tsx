import { useNavigate } from "react-router-dom"
import {
  Phone,
  PhoneCall,
  ClipboardList,
  Pill,
  Clock,
  NotebookPen,
  HeartPulse,
  Wind,
  AlertCircle,
} from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { patient, emergencyEvent } from "@/lib/data"

// 심장질환(심박 이상·흉통) 응급 대응 - 보호자 관점
// 요양병원 상주 의료진이 1차 대응하므로, 보호자는 원격에서
// 병원 연락과 상황 파악·정보 전달에 집중하도록 구성.
// 각 단계에 픽토그램(아이콘)을 넣어 직관적으로 안내.
const steps = [
  {
    Icon: PhoneCall,
    title: "당황하지 말고 즉시 병원(병동)에 연락하세요",
    body: "가장 먼저 환자가 있는 병동에 전화해 상황을 알립니다. 상주 의료진이 신속히 확인하고 응급 처치를 시작할 수 있습니다.",
  },
  {
    Icon: ClipboardList,
    title: "증상을 구체적으로 전달하세요",
    body: "가슴 통증, 호흡 곤란, 식은땀, 의식 저하 여부 등 알림에 표시된 심박수·호흡수와 함께 관찰된 증상을 정확히 전달합니다.",
  },
  {
    Icon: Pill,
    title: "환자 병력·복용 약을 공유하세요",
    body: "협심증 등 심장질환 병력과 항혈전제·심장약 복용 정보를 의료진에게 알려 처치에 참고할 수 있도록 합니다.",
  },
  {
    Icon: Clock,
    title: "병원 안내에 따라 대기하세요",
    body: "의료진의 처치가 진행되는 동안 전화를 유지하며 추가 상황을 확인합니다. 필요 시 119 이송 여부를 병원과 함께 결정합니다.",
  },
  {
    Icon: NotebookPen,
    title: "이후 경과와 조치를 기록하세요",
    body: "연락 시각, 전달한 증상, 병원 안내 내용을 메모해 두면 이후 진료·상담과 다음 대응에 도움이 됩니다.",
  },
]

const warningSigns = [
  "가슴을 쥐어짜는 듯한 흉통",
  "숨참·호흡 곤란",
  "식은땀·창백함",
  "의식 흐려짐·실신",
]

export default function EmergencyGuide() {
  const navigate = useNavigate()

  // 심박/호흡 이상을 나눠서 상단 요약에 표기
  const detected = [
    emergencyEvent.heartAbnormal && { Icon: HeartPulse, label: "심박수", value: `${emergencyEvent.heartRate} bpm`, status: emergencyEvent.heartStatus },
    emergencyEvent.respAbnormal && { Icon: Wind, label: "호흡수", value: `${emergencyEvent.respiration} 회/분`, status: emergencyEvent.respStatus },
  ].filter(Boolean) as { Icon: typeof HeartPulse; label: string; value: string; status: string }[]

  return (
    <Screen>
      <TopBar title="심장질환 응급 대응 가이드" back />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-3xl bg-danger/10 p-5">
          <p className="text-sm font-semibold text-danger">
            {detected.map((d) => d.label).join("·") || "심박수"} 이상 응급 상황
          </p>
          <p className="mt-1 text-balance leading-relaxed text-foreground">
            {patient.name} 님의 {detected.map((d) => d.label).join("·") || "심박수"} 이상이 감지되었습니다. 심장질환 이력이 있는 환자이므로 아래 순서에 따라 침착하게 대응해 주세요.
          </p>

          {/* 감지된 이상 생체신호 (나눠서 표시) */}
          {detected.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {detected.map((d) => (
                <div key={d.label} className="flex items-center gap-2 rounded-2xl bg-card p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                    <d.Icon size={18} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {d.label} · <span className="font-semibold text-danger">{d.status}</span>
                    </p>
                    <p className="truncate text-sm font-bold text-foreground">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 주의해야 할 위험 신호 */}
        <div className="mt-5 rounded-2xl border border-danger/30 bg-card p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-danger">
            <AlertCircle size={16} aria-hidden />
            이런 증상이 함께 있는지 확인하세요
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {warningSigns.map((w) => (
              <li key={w} className="flex items-center gap-2 text-sm text-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
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

        <div className="mt-5 rounded-2xl bg-muted/60 p-4">
          <p className="text-sm font-semibold text-foreground">환자 특이사항</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            고혈압·협심증 병력이 있어 심장질환 관리가 필요합니다. 항혈전제·심장약을 복용 중이며, 흉통 호소 시 즉시 병동 확인이 필요합니다.
          </p>
        </div>
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
          onClick={() => navigate("/home")}
          className="h-12 w-full text-sm font-medium text-muted-foreground"
        >
          홈화면으로
        </button>
      </div>
    </Screen>
  )
}
