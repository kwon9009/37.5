import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Heart, Wind, UserCheck, UserX, X, AlertTriangle, Bell, Trash2 } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { BottomNav } from "@/guardian/components/BottomNav"
import { useGuardianData, levelLabel, HR_NORMAL, RR_NORMAL } from "@/guardian/lib/api"
import { cn } from "@/guardian/lib/utils"

/**
 * 서버가 주는 값은 1분 평균 로그라서 하루치면 1440개가 된다.
 * 그대로 그리면 점이 너무 많아 읽기 어렵고 "시간당"도 아니므로,
 * 같은 시(00~23)끼리 평균 내어 최대 24개(=하루치)로 줄인다.
 */
function toHourlySeries(series: { t: string; value: number }[]) {
  const sum = new Map<string, { total: number; count: number }>()
  for (const point of series) {
    if (point.value == null) continue
    const acc = sum.get(point.t) ?? { total: 0, count: 0 }
    acc.total += point.value
    acc.count += 1
    sum.set(point.t, acc)
  }
  return [...sum.entries()]
    .map(([t, { total, count }]) => ({ t, value: Math.round(total / count) }))
    .sort((a, b) => a.t.localeCompare(b.t))
}

/**
 * 생체신호 큰 카드: 위에 현재값, 아래에 시간당 추이 그래프.
 * 그래프는 하루치(00~23시)를 보여주며, 서버가 준 1분 평균 로그를 시간 단위로 묶어서 그린다.
 */
function VitalPanel({
  icon,
  label,
  value,
  unit,
  status,
  series,
  color,
  chartId,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit: string
  status: string
  series: { t: string; value: number }[]
  color: string
  chartId: string
}) {
  const abnormal = status !== "정상"
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-danger/10" style={{ color }}>
          {icon}
        </span>
        <span className="flex-1 font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            abnormal ? "bg-danger/15 text-danger" : "bg-success/15 text-success",
          )}
        >
          {status}
        </span>
      </div>

      {/* 현재값 - 화면에서 가장 크게.
          단위를 숫자 옆에 두면 "숫자+단위" 덩어리가 가운데로 정렬돼서
          정작 숫자는 중앙에서 왼쪽으로 밀린다. 단위를 아래로 내려
          자릿수(78/100 등)가 바뀌어도 숫자가 항상 정중앙에 오게 한다. */}
      <div className="mt-3 flex flex-col items-center">
        <span className="text-5xl font-bold leading-none text-foreground">{value}</span>
        <span className="mt-1.5 text-sm font-medium text-muted-foreground">{unit}</span>
      </div>

      {/* 시간당 추이 (하루치) */}
      <div className="mt-4 h-36 w-full">
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={11} stroke="#806467" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#806467" width={34} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f1d6d0", fontSize: 12 }}
                formatter={(v) => [v == null ? "-" : `${v} ${unit}`, ""]}
                labelFormatter={(l) => `${l}시`}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${chartId})`} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            아직 기록된 추이가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { patient, vitals, notifications, heartRateSeries, respirationSeries } = useGuardianData()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifItems, setNotifItems] = useState(notifications)
  useEffect(() => setNotifItems(notifications), [notifications])
  const urgentCount = notifItems.filter((n) => n.type === "urgent").length

  // 1분 단위 로그를 시간당(최대 24개)으로 묶어 그래프에 넘긴다.
  const hourlyHeartRate = useMemo(() => toHourlySeries(heartRateSeries), [heartRateSeries])
  const hourlyRespiration = useMemo(() => toHourlySeries(respirationSeries), [respirationSeries])

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

        {/* Vitals - 위: 심박수 / 아래: 호흡수 (각각 현재값 + 시간당 추이) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">실시간 생체신호</h2>
          <VitalPanel
            icon={<Heart size={18} aria-hidden />}
            label="심박수"
            value={vitals.heartRate}
            unit="bpm"
            status={levelLabel(vitals.heartRate, HR_NORMAL)}
            series={hourlyHeartRate}
            color="#dc2626"
            chartId="home-hr"
          />
          <VitalPanel
            icon={<Wind size={18} aria-hidden />}
            label="호흡수"
            value={vitals.respiration}
            unit="회/분"
            status={levelLabel(vitals.respiration, RR_NORMAL)}
            series={hourlyRespiration}
            color="#d76773"
            chartId="home-rr"
          />
        </div>

      </div>

      <BottomNav />

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
