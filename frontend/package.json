import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Screen, TopBar } from "@/components/Screen"
import { Button, Field } from "@/components/ui"

export default function Signup() {
  const navigate = useNavigate()
  const [phoneSent, setPhoneSent] = useState(false)

  return (
    <Screen>
      <TopBar title="회원가입" back />
      <form
        className="flex flex-1 flex-col overflow-y-auto"
        onSubmit={(e) => {
          e.preventDefault()
          navigate("/patient-info")
        }}
      >
        <div className="flex-1 space-y-5 px-5 py-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">계정 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">보호자 본인 인증 후 계정을 생성합니다.</p>
          </div>

          <Field id="name" label="성명" placeholder="성명을 입력하세요" required />
          <Field id="relation" label="환자와의 관계" placeholder="예: 자녀, 배우자" required />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">연락처</span>
            <div className="flex gap-2">
              <Field id="phone" type="tel" placeholder="휴대폰 번호" className="flex-1" required />
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-auto whitespace-nowrap px-4"
                onClick={() => setPhoneSent(true)}
              >
                인증
              </Button>
            </div>
          </div>

          {phoneSent && (
            <Field id="code" label="인증번호" placeholder="인증번호 6자리" inputMode="numeric" className="fade-up" />
          )}

          <div className="h-px bg-border" />

          <Field id="userid" label="아이디" placeholder="아이디를 입력하세요" required />
          <Field id="pw" label="비밀번호" type="password" placeholder="비밀번호를 입력하세요" required />
          <Field id="pw2" label="비밀번호 재입력" type="password" placeholder="비밀번호를 다시 입력하세요" required />
        </div>
        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit">다음</Button>
        </div>
      </form>
    </Screen>
  )
}
