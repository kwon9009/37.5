import { useNavigate } from "react-router-dom"
import { Screen, TopBar } from "@/components/Screen"
import { Button, Field } from "@/components/ui"
import { patient } from "@/lib/data"

export default function AccountEdit() {
  const navigate = useNavigate()
  return (
    <Screen>
      <TopBar title="계정 정보 수정" back />
      <form
        className="flex flex-1 flex-col overflow-y-auto"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(-1)
        }}
      >
        <div className="flex-1 space-y-5 px-5 py-6">
          <Field id="gname" label="성명" defaultValue={patient.guardian} />
          <Field id="grelation" label="환자와의 관계" defaultValue={patient.relation} />
          <Field id="gphone" label="연락처" type="tel" defaultValue="010-1234-5678" />
        </div>
        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit">저장</Button>
        </div>
      </form>
    </Screen>
  )
}
