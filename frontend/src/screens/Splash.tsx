import { useNavigate } from "react-router-dom"
import { Screen } from "@/components/Screen"
import { Button } from "@/components/ui"

export default function Splash() {
  const navigate = useNavigate()
  return (
    <Screen className="bg-primary text-primary-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative mb-6">
          <span className="pulse-ring absolute inset-1 rounded-full bg-primary-foreground/30" />
          <img
            src="/images/37-5-logo.png"
            alt="37.5°C 건강 모니터링 로고"
            className="relative h-32 w-32 object-contain drop-shadow-lg"
          />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">37.5°C</h1>
        <p className="mt-3 text-balance text-center text-primary-foreground/80">
          따스한 마음으로 더 많은 생명을 살리자!
        </p>
      </div>
      <div className="px-6 pb-10">
        <Button variant="outline" className="border-transparent font-bold text-primary-foreground/80" onClick={() => navigate("/terms")}>
          시작하기
        </Button>
        <p className="mt-4 text-center text-xs text-primary-foreground/60">버전 1.0.0</p>
      </div>
    </Screen>
  )
}
