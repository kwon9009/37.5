import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Card } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"

type Choice = "yes" | "no" | null

function ConsentBlock({
  required,
  title,
  body,
  restriction,
  value,
  onChange,
}: {
  required?: boolean
  title: string
  body: string
  restriction: string
  value: Choice
  onChange: (c: Choice) => void
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            required ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary",
          )}
        >
          {required ? "필수" : "선택"}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="rounded-2xl bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
        <p>{body}</p>
        <p className="mt-2 text-xs text-muted-foreground/80">{restriction}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange("yes")}
          className={cn(
            "h-11 flex-1 rounded-xl border text-sm font-semibold transition",
            value === "yes"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground",
          )}
        >
          예, 동의합니다
        </button>
        <button
          onClick={() => onChange("no")}
          className={cn(
            "h-11 flex-1 rounded-xl border text-sm font-semibold transition",
            value === "no" 
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground",
          )}
        >
          아니오
        </button>
      </div>
    </Card>
  )
}

export default function Terms() {
  const navigate = useNavigate()
  const [required, setRequired] = useState<Choice>(null)
  const [optional, setOptional] = useState<Choice>(null)

  const canProceed = required === "yes"

  return (
    <Screen>
      <TopBar title="정보 보관 약관 동의" back />
      <StickyAction
        className="space-y-4 px-5 py-5"
        action={
          <Button disabled={!canProceed} onClick={() => navigate("/guardian/signup")}>
            동의하고 계속하기
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          서비스 이용을 위해 아래 약관에 동의해 주세요. 필수 항목에 동의하지 않으면 서비스 이용이 제한될 수 있습니다.
        </p>
        <ConsentBlock
          required
          title="사용자 정보 보관에 대한 사항"
          body="사용자 및 환자의 생체신호·계정 정보를 안전하게 보관하고 모니터링 목적에 한해 활용합니다."
          restriction="거부 시 서비스 이용이 불가능합니다."
          value={required}
          onChange={setRequired}
        />
        <ConsentBlock
          title="이벤트 정보 수집에 대한 선택적 동의"
          body="서비스 개선 및 맞춤 알림을 위한 이용 이벤트 정보를 수집합니다."
          restriction="거부 시 서비스 최적화에 제약이 있을 수 있습니다."
          value={optional}
          onChange={setOptional}
        />
      </StickyAction>
    </Screen>
  )
}
