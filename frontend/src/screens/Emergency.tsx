import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Phone, BookOpen } from "lucide-react"
import { Screen } from "@/components/Screen"
import { patient } from "@/lib/data"

export default function Emergency() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  return (
    <Screen className="bg-danger text-danger-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8">
          <span className="pulse-ring absolute inset-0 rounded-full bg-danger-foreground/40" />
          <div className="relative grid h-28 w-28 place-items-center rounded-full bg-danger-foreground/20">
            <AlertTriangle size={56} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <h1 className="text-3xl font-bold">긴급 상황 발생</h1>
        <p className="mt-3 text-balance text-lg font-semibold text-danger-foreground/90">
          {patient.name} 님에게 낙상이 감지되었습니다.
        </p>
        <p className="mt-2 text-balance leading-relaxed text-danger-foreground/80">
          즉시 상태를 확인하고 필요한 조치를 취해 주세요. 상황이 심각할 수 있습니다.
        </p>
      </div>

      <div className="space-y-3 px-6 pb-10">
        <a
          href="tel:0000000000"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-danger-foreground font-semibold text-danger"
        >
          <Phone size={20} aria-hidden />
          병원 연락하기
        </a>
        <button
          onClick={() => navigate("/emergency/guide")}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-danger-foreground/40 font-semibold text-danger-foreground"
        >
          <BookOpen size={20} aria-hidden />
          응급 대응 가이드 이동
        </button>
        <button
          disabled={countdown > 0}
          onClick={() => navigate("/home")}
          className="h-12 w-full text-sm font-medium text-danger-foreground/80 disabled:text-danger-foreground/50"
        >
          {countdown > 0 ? `${countdown}초 뒤 홈화면으로 이동 가능` : "홈화면으로"}
        </button>
      </div>
    </Screen>
  )
}
