import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"

import { apiClient } from "@/api/client.js"
import { fetchMyLinkRequests } from "@/guardian/lib/patient-link"

/**
 * 연결된 환자가 있는 보호자만 통과시킨다.
 *
 * 왜 필요한가:
 *   보호자 앱의 모든 화면은 "내 환자"가 있어야 의미가 있다. 그런데 로그인은
 *   역할만 보고 홈으로 보내기 때문에, 아직 병원 승인을 못 받은 보호자가
 *   앱을 껐다 켜고 다시 로그인하면 환자명 "-", 심박 0인 빈 홈 화면을 보게 된다.
 *   보호자는 "왜 아무것도 안 나오지?" 하고 헤매게 된다.
 *
 *   가입 직후에는 환자 정보 화면에서 대기 화면으로 넘어가지만, 그 뒤 다시
 *   로그인하는 경로는 그 흐름을 타지 않아서 여기서 한 번 더 확인한다.
 *
 * 보내는 곳
 *   신청을 낸 적이 있다  -> 승인 대기 화면 (거절됐으면 대기 화면이 사유를 보여준다)
 *   신청한 적이 없다     -> 환자 정보 입력 화면
 *
 * 대기·환자정보 화면은 이 가드 바깥에 있어서 다시 튕겨 나오지 않는다.
 */

type State = "checking" | "ok" | "waiting" | "register"

export default function RequireLinkedPatient() {
  const [state, setState] = useState<State>("checking")

  useEffect(() => {
    let alive = true

    async function check() {
      try {
        const { data: me } = await apiClient.get("/guardians/me")
        if (!alive) return

        if (me.patients?.length > 0) {
          setState("ok")
          return
        }

        // 연결된 환자가 없다. 신청을 낸 적이 있는지 보고 갈 곳을 정한다.
        const requests = await fetchMyLinkRequests()
        if (!alive) return
        setState(requests.length > 0 ? "waiting" : "register")
      } catch {
        // 조회에 실패하면 막지 않고 그냥 들여보낸다.
        // 통신이 잠깐 끊겼다고 앱을 못 쓰게 되는 편이 더 나쁘다.
        if (alive) setState("ok")
      }
    }

    check()

    return () => {
      alive = false
    }
  }, [])

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    )
  }

  if (state === "waiting") return <Navigate to="/guardian/waiting" replace />
  if (state === "register") return <Navigate to="/guardian/patient-info" replace />

  return <Outlet />
}
