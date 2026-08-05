import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Wind, UserCheck, UserX, Phone, FileText, X, AlertTriangle, Bell, Trash2 } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { BottomNav } from "@/guardian/components/BottomNav"
import { useGuardianData } from "@/guardian/lib/api"
import {
  fetchHospitalByCode,
  findHospitalByName,
  getRegisteredHospitalCode,
  telHref,
  type HospitalInfo,
} from "@/guardian/lib/hospitals"

// 백엔드 미연결 시에도 응급 상황(10초 타이머) 데모가 특이사항까지 보여주도록 하는 폴백
const DEMO_SPECIAL_NOTE =
  "고혈압·협심증 병력, 심장질환 관리 중이며 항혈전제·심장약 규칙적 복용 필요, 흉통 호소 여부 확인 요망."

function VitalCard({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit: string
  tone: string
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center shadow-sm">
      <span className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { patient, vitals, notifications, specialNote } = useGuardianData()
  const [showNote, setShowNote] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifItems, setNotifItems] = useState(notifications)
  useEffect(() => setNotifItems(notifications), [notifications])
  const urgentCount = notifItems.filter((n) => n.type === "urgent").length

  // 병원 연락처.
  // 회원가입 때 등록한 병원 코드로 서버에서 조회하고, 코드가 없으면
  // 서버가 준 병원 이름으로 개발용 목록에서 찾는다.
  const [hospitalContact, setHospitalContact] = useState<HospitalInfo | null>(null)
  useEffect(() => {
    let alive = true
    const code = getRegisteredHospitalCode()
    if (code) {
      fetchHospitalByCode(code).then((found) => {
        if (alive) setHospitalContact(found ?? findHospitalByName(patient.hospital))
      })
    } else {
      setHospitalContact(findHospitalByName(patient.hospital))
    }
    return () => {
      alive = false
    }
  }, [patient.hospital])

  // [일시 비활성 - 개발용] 홈 화면에 상주한 지 10초가 지나면 응급 화면으로 자동 이동하는 데모 기능.
  // 개발 중에는 홈에 10초만 머물러도 긴급 화면으로 튕겨서 작업이 어려우므로 잠시 꺼둔다.
  // 시연/발표 때 다시 켜려면 아래 useEffect 의 주석만 풀면 된다.
  // useEffect(() => {
  //   const timer = window.setTimeout(() => navigate("/guardian/emergency"), 10 * 1000)
  //   return () => window.clearTimeout(timer)
  // }, [navigate])

  return (
    <Screen>
      <TopBar
        title="37.5°C"
        logo
        bell
        bellCount={notifItems.length}
        onBellClick={() => setShowNotifications(true)}
      />
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Patient summary */}
        <div className="flex items-center justify-between rounded-3xl bg-primary p-5 text-primary-foreground">
          <div>
            <p className="text-sm text-primary-foreground/80">좋은 하루 되세요!</p>
            <p className="mt-0.5 text-xl font-bold">{patient.name}</p>
            <p className="text-sm text-primary-foreground/80">
              {patient.hospital} · {patient.room}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-primary-foreground/15 px-4 py-3">
            {vitals.present ? (
              <>
                <UserCheck size={24} aria-hidden />
                <span className="mt-1 text-xs font-semibold">재실</span>
              </>
            ) : (
              <>
                <UserX size={24} aria-hidden />
                <span className="mt-1 text-xs font-semibold">부재</span>
              </>
            )}
          </div>
        </div>

        {/* 긴급 알림 (실시간 생체신호 위) */}
        {urgentCount > 0 && (
          <button
            onClick={() => navigate("/guardian/emergency")}
            className="flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger">
              <AlertTriangle size={20} aria-hidden />
            </span>
            <span className="text-sm font-semibold text-danger">
              긴급 알림 {urgentCount}건 · 확인이 필요합니다
            </span>
          </button>
        )}

        {/* Vitals */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">실시간 생체신호</h2>
          <div className="grid grid-cols-2 gap-3">
            <VitalCard
              icon={<Heart size={20} aria-hidden />}
              label="심박수"
              value={vitals.heartRate}
              unit="bpm"
              tone="bg-danger/10 text-danger"
            />
            <VitalCard
              icon={<Wind size={20} aria-hidden />}
              label="호흡수"
              value={vitals.respiration}
              unit="회/분"
              tone="bg-danger/10 text-primary"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">빠른 실행</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 회원가입 때 등록한 병원 번호로 전화 앱을 연다.
                번호를 못 찾으면(등록 전이거나 목록에 없는 병원) 눌리지 않게 비활성 처리. */}
            {hospitalContact?.phone ? (
              <a
                href={telHref(hospitalContact.phone)}
                aria-label={`${hospitalContact.name} ${hospitalContact.phone} 로 전화 걸기`}
                className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center shadow-sm"
              >
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Phone size={20} aria-hidden />
                </span>
                <span className="font-semibold text-foreground">병원 연락</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{hospitalContact.phone}</span>
              </a>
            ) : (
              <div
                className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center opacity-60 shadow-sm"
                role="note"
              >
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <Phone size={20} aria-hidden />
                </span>
                <span className="font-semibold text-foreground">병원 연락</span>
                <span className="mt-0.5 text-xs text-muted-foreground">번호 확인 중</span>
              </div>
            )}

            {/* Special note */}
            <button
              onClick={() => setShowNote(true)}
              className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center shadow-sm"
            >
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FileText size={20} aria-hidden />
              </span>
              <span className="font-semibold text-foreground">특이사항확인</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {showNote && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 sm:items-center"
          onClick={() => setShowNote(false)}
        >
          <div
            className="fade-up w-full max-w-[26rem] rounded-t-3xl bg-card p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="응급 스크리닝 필요"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">응급 스크리닝 필요</h3>
              <button
                aria-label="닫기"
                onClick={() => setShowNote(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <p className="leading-relaxed text-foreground">{specialNote || DEMO_SPECIAL_NOTE}</p>
            <button
              onClick={() => setShowNote(false)}
              className="mt-6 h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 알림 서랍 - 오른쪽에서 슬라이드로 열리고 반투명해서 메인화면이 비쳐 보임 */}
      {showNotifications && (
        <div
          className="absolute inset-0 z-40 flex justify-end bg-foreground/20"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="slide-in-right flex h-full w-[82%] max-w-[20rem] flex-col bg-card/15 shadow-xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="알림 내역"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4">
              <h3 className="text-base font-bold text-foreground">알림 내역</h3>
              <div className="flex items-center gap-1">
                {notifItems.length > 0 && (
                  <button
                    onClick={() => setNotifItems([])}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/60"
                  >
                    <Trash2 size={14} aria-hidden />
                    비우기
                  </button>
                )}
                <button
                  aria-label="닫기"
                  onClick={() => setShowNotifications(false)}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"
                >
                  <X size={20} aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-2">
                {notifItems.map((n) => {
                  const urgent = n.type === "urgent"
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          if (!urgent) return
                          setShowNotifications(false)
                          navigate("/guardian/emergency")
                        }}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left ${
                          urgent ? "border-danger/30 bg-danger/10" : "border-border/70 bg-card/60"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                            urgent ? "bg-danger/15 text-danger" : "bg-muted/70 text-primary"
                          }`}
                        >
                          {urgent ? <AlertTriangle size={16} aria-hidden /> : <Bell size={16} aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs font-semibold ${urgent ? "text-danger" : "text-foreground"}`}
                          >
                            {urgent ? "긴급 알림" : "일반 알림"}
                          </span>
                          <span className="mt-0.5 block text-sm leading-relaxed text-foreground">{n.title}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{n.time}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {notifItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted/70 text-muted-foreground">
                    <Bell size={22} aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-foreground">새로운 알림이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}
