import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { Button } from "@/guardian/components/ui"
import { fetchMyLinkRequests, type LinkRequest } from "@/guardian/lib/patient-link"

/**
 * 병원 승인 대기 화면.
 *
 * 병원이 승인/거절 버튼을 누르는 시점을 알 수 없으므로 주기적으로 상태를 확인한다.
 * (웹푸시가 붙기 전까지의 방식이다. 붙으면 알림을 받고 바로 갱신하면 된다)
 */

/** 상태를 다시 확인하는 간격. 사람이 승인 버튼을 누르는 일이라 짧을 필요가 없다. */
const POLL_INTERVAL_MS = 10_000

export default function Waiting() {
  const navigate = useNavigate()
  const [request, setRequest] = useState<LinkRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function check() {
      try {
        const requests = await fetchMyLinkRequests()
        if (!alive) return
        // 목록은 최근 것부터 온다. 가장 최근에 낸 신청의 상태를 본다.
        setRequest(requests[0] ?? null)
      } catch {
        // 조회에 실패해도 화면은 그대로 두고 다음 확인 때 다시 시도한다.
        // 통신이 잠깐 끊겼다고 "거절됨"처럼 보이면 안 된다.
      } finally {
        if (alive) setLoading(false)
      }
    }

    check()
    const timer = setInterval(check, POLL_INTERVAL_MS)

    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  // 승인되면 홈으로 넘긴다. 뒤로 가기로 대기 화면에 돌아오지 않도록 replace 한다.
  useEffect(() => {
    if (request?.status === "APPROVED") {
      navigate("/guardian/home", { replace: true })
    }
  }, [request?.status, navigate])

  const rejected = request?.status === "REJECTED"
  const hospitalName = request?.hospital_name

  return (
    <Screen>
      <TopBar title={rejected ? "승인 거절" : "승인 대기"} back />

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {rejected ? (
          <>
            <div className="mb-8 grid h-28 w-28 place-items-center rounded-full bg-danger/12 text-danger">
              <XCircle size={52} strokeWidth={1.8} aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-foreground">연동이 거절되었습니다</h2>
            <p className="mt-3 text-balance leading-relaxed text-muted-foreground">
              {hospitalName ? `${hospitalName}에서 ` : ""}
              환자 정보를 확인하지 못했습니다. 입력하신 환자 성명과 생년월일을
              다시 확인한 뒤 신청해 주세요.
            </p>
          </>
        ) : (
          <>
            <div className="relative mb-8">
              <span className="pulse-ring absolute inset-0 rounded-full bg-accent/30" />
              <div className="relative grid h-28 w-28 place-items-center rounded-full bg-accent/15 text-accent">
                <Clock size={52} strokeWidth={1.8} aria-hidden />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {hospitalName ? `${hospitalName} 승인을 기다리고 있어요` : "병원 승인을 기다리고 있어요"}
            </h2>
            <p className="mt-3 text-balance leading-relaxed text-muted-foreground">
              입력하신 환자 정보를 병원에서 확인하고 있습니다. 승인이 완료되면
              이 화면이 자동으로 넘어갑니다.
            </p>

            {request && (
              <dl className="mt-6 w-full space-y-1.5 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">환자</dt>
                  <dd className="font-semibold text-foreground">
                    {request.patient_name} ({request.relation})
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">생년월일</dt>
                  <dd className="font-semibold text-foreground">{request.birthdate}</dd>
                </div>
              </dl>
            )}

            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground/80">
              {loading ? (
                "신청 상태를 확인하는 중…"
              ) : (
                <>
                  <CheckCircle2 size={13} aria-hidden />
                  자동으로 확인하고 있습니다
                </>
              )}
            </p>
          </>
        )}
      </div>

      <div className="px-6 pb-10">
        {rejected ? (
          <Button onClick={() => navigate("/guardian/patient-info", { replace: true })}>
            환자 정보 다시 입력
          </Button>
        ) : (
          <Button onClick={() => navigate("/guardian/login")}>로그인 화면으로</Button>
        )}
      </div>
    </Screen>
  )
}
