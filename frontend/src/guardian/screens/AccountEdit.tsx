import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { apiClient, getErrorMessage } from "@/api/client.js"
import { useGuardianData } from "@/guardian/lib/api"

export default function AccountEdit() {
  const navigate = useNavigate()
  const { patient, loading } = useGuardianData()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  // 서버 값이 도착하면 한 번만 입력칸을 채운다.
  // 계속 덮어쓰면 사용자가 고치는 중에 글자가 되돌아간다.
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    if (filled) return

    let cancelled = false
    apiClient
      .get("/guardians/me")
      .then(({ data }) => {
        if (cancelled) return
        setName(data.name ?? "")
        setPhone(data.phone ?? "")
        setEmail(data.email ?? "")
        setFilled(true)
      })
      .catch(() => {
        if (!cancelled) setError("계정 정보를 불러오지 못했습니다.")
      })

    return () => {
      cancelled = true
    }
  }, [filled])

  // 연락처: 입력 중 자동으로 010-XXXX-XXXX 형태로 맞춘다 (회원가입 화면과 동일)
  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 11)
    let out = digits
    if (digits.length > 3 && digits.length <= 7) {
      out = `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else if (digits.length > 7) {
      out = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }
    setPhone(out)
    setError("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("성명을 입력해 주세요.")
      return
    }
    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      setError("연락처를 010-XXXX-XXXX 형태로 입력해 주세요.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 형식이 올바르지 않습니다.")
      return
    }

    setSaving(true)
    try {
      await apiClient.patch("/guardians/me", {
        name: name.trim(),
        phone,
        email: email.trim(),
      })
      navigate(-1)
    } catch (err) {
      setError(getErrorMessage(err, "저장 중 오류가 발생했습니다."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <TopBar title="계정 정보 수정" back />
      <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-5 px-5 py-6">
          <Field id="gname" label="성명" value={name} onChange={(e) => setName(e.target.value)} />
          <Field id="gphone" label="연락처" type="tel" value={phone} onChange={handlePhoneChange} />
          <div>
            <Field id="gemail" label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              비밀번호를 잊었을 때와 긴급 알림 전달에 사용됩니다.
            </p>
          </div>

          {/* 환자와의 관계는 병원이 연동을 승인할 때 정해지므로 여기서 바꿀 수 없다 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">환자와의 관계</span>
            <div className="flex h-13 items-center rounded-2xl border border-input bg-muted/40 px-4 text-base text-muted-foreground">
              {loading ? "불러오는 중..." : patient.relation}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              병원에서 환자 연동을 승인할 때 등록된 정보입니다. 변경하려면 병원에 문의해 주세요.
            </p>
          </div>

          {error && (
            <p className="verify-warning" role="alert">
              <AlertCircle size={14} aria-hidden />
              {error}
            </p>
          )}
        </div>
        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </Screen>
  )
}
