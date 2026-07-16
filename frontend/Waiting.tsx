import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Screen, TopBar } from "@/components/Screen"
import { Button, Field } from "@/components/ui"
import { cn } from "@/lib/utils"

export default function PatientInfo() {
  const navigate = useNavigate()
  const [gender, setGender] = useState<"male" | "female" | null>(null)

  return (
    <Screen>
      <TopBar title="환자 정보 확인" back />
      <form
        className="flex flex-1 flex-col overflow-y-auto"
        onSubmit={(e) => {
          e.preventDefault()
          navigate("/hospital")
        }}
      >
        <div className="flex-1 space-y-5 px-5 py-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">환자 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">모니터링할 환자의 기본 정보입니다.</p>
          </div>

          <Field id="pname" label="환자 성명" placeholder="환자 성명을 입력하세요" required />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">환자 성별</span>
            <div className="flex gap-2">
              {[
                { key: "male", label: "남성" },
                { key: "female", label: "여성" },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGender(g.key as "male" | "female")}
                  className={cn(
                    "h-13 flex-1 rounded-2xl border text-sm font-semibold transition",
                    gender === g.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <Field id="birth" label="환자 생년월일" placeholder="YYYY.MM.DD" inputMode="numeric" required />
        </div>
        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit">확인하기</Button>
        </div>
      </form>
    </Screen>
  )
}
