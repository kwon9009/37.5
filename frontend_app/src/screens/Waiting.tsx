import { useNavigate } from "react-router-dom"
import { Clock } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { Button } from "@/components/ui"

export default function Waiting() {
  const navigate = useNavigate()
  return (
    <Screen>
      <TopBar title="승인 대기" back />
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8">
          <span className="pulse-ring absolute inset-0 rounded-full bg-accent/30" />
          <div className="relative grid h-28 w-28 place-items-center rounded-full bg-accent/15 text-accent">
            <Clock size={52} strokeWidth={1.8} aria-hidden />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">병원 승인을 기다리고 있어요</h2>
        <p className="mt-3 text-balance leading-relaxed text-muted-foreground">
          입력하신 환자 정보를 병원에서 확인하고 있습니다. 승인이 완료되면 알림으로 안내해 드릴게요.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/80">잠시만 기다려 주세요.</p>
      </div>
      <div className="px-6 pb-10">
        <Button onClick={() => navigate("/login")}>로그인 화면으로</Button>
      </div>
    </Screen>
  )
}
