import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Area, AreaChart, CartesianGrid, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts"
import { Heart, Wind, UserCheck, UserX, X, AlertTriangle, Bell, Trash2 } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { BottomNav } from "@/guardian/components/BottomNav"
import {
  useGuardianData,
  heartRateLevel,
  respirationLevel,
  toHourlySeries,
  HR_NORMAL,
  RR_NORMAL,
  type HourlyPoint,
  type VitalLevel,
} from "@/guardian/lib/api"
import { cn } from "@/guardian/lib/utils"

/** 그래프에서 한 시간이 차지하는 가로 폭(px).
 *  24시간을 폰 화면에 다 넣으면 시각 숫자가 겹치므로, 폭을 고정하고 가로 스크롤로 넘겨 본다. */
const HOUR_W = 46

/** 등급별 배지 색. 정상은 초록, 한 단계 벗어나면 주황, 두 단계면 빨강. */
const LEVEL_STYLE: Record<VitalLevel, string> = {
  "매우 낮음": "bg-danger/15 text-danger",
  낮음: "bg-accent/20 text-accent-foreground",
  정상: "bg-success/15 text-success",
  높음: "bg-accent/20 text-accent-foreground",
  "매우 높음": "bg-danger/15 text-danger",
  "기록 없음": "bg-muted text-muted-foreground",
}

/** 현재값 카드. 지금 상태를 좌우로 나란히 놓고 한눈에 비교하는 용도. */
function VitalValueCard({
  icon,
  label,
  value,
  unit,
  status,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit: string
  status: VitalLevel
  color: string
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 shadow-sm">
      <span className="flex items-center gap-1.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-danger/10" style={{ color }}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>

      {/* 단위를 숫자 옆이 아니라 아래에 둔다. 옆에 두면 "숫자+단위" 덩어리가
          가운데 정렬돼서 자릿수(78→100)가 바뀔 때 숫자가 좌우로 흔들린다. */}
      <span className="mt-3 text-4xl font-bold leading-none text-foreground">{value}</span>
      <span className="mt-1 text-xs font-medium text-muted-foreground">{unit}</span>

      <span className={cn("mt-3 rounded-full px-2.5 py-1 text-xs font-bold", LEVEL_STYLE[status])}>
        {status}
      </span>
    </div>
  )
}

/**
 * 시간별 추이 그래프 카드.
 * 하루치(00~23시)를 보여주며, 서버가 준 1분 평균 로그를 시간 단위로 묶어서 그린다.
 */
function VitalTrendCard({
  icon,
  label,
  unit,
  series,
  color,
  chartId,
  fallbackDomain,
  normalRange,
}: {
  icon: React.ReactNode
  label: string
  unit: string
  /** 00~23시 24칸. 기록이 없는 시간은 value 가 null 이라 선이 끊겨 그려진다. */
  series: HourlyPoint[]
  color: string
  chartId: string
  /** 값이 하나도 없을 때 y축이 0~0 으로 뭉개지지 않도록 잡아 줄 기본 범위 */
  fallbackDomain: [number, number]
  /** 정상 범위. 축 숫자 대신 옅은 띠로 깔아 값의 높낮이를 가늠하게 한다. */
  normalRange: { min: number; max: number }
}) {
  const hasAnyValue = series.some((p) => p.value != null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 지금 시각이 화면 가운데 오도록 맞춰 둔다. 그래야 열자마자 최근 흐름이 보이고,
  // 지나간 시간은 왼쪽으로 밀어서(스와이프) 볼 수 있다.
  //
  // 위치를 HOUR_W 로 계산하면 recharts 내부 여백만큼 어긋난다(실측 13px).
  // 기록 화면 캘린더와 같은 방식으로, 실제 그려진 눈금의 화면 좌표를 재서 맞춘다.
  // 단 마운트 직후에는 recharts 가 아직 눈금을 그리기 전이라 요소를 못 찾는다.
  // 그려질 때까지 몇 프레임 기다렸다가 맞추고, 끝내 못 찾으면 계산식으로라도 맞춘다.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nowLabel = String(new Date().getHours()).padStart(2, "0")
    let raf = 0
    let tries = 0

    const center = () => {
      const tick = [...el.querySelectorAll("svg text")].find((t) => t.textContent === nowLabel)
      if (tick) {
        const containerRect = el.getBoundingClientRect()
        const tickRect = tick.getBoundingClientRect()
        const offsetInContainer = tickRect.left - containerRect.left
        const centerOffset = el.clientWidth / 2 - tickRect.width / 2
        el.scrollLeft += offsetInContainer - centerOffset
        return
      }
      if (tries++ < 10) {
        raf = requestAnimationFrame(center)
      } else {
        el.scrollLeft = new Date().getHours() * HOUR_W + HOUR_W / 2 - el.clientWidth / 2
      }
    }

    raf = requestAnimationFrame(center)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-danger/10" style={{ color }}>
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* 시간당 추이 (하루치).
          24시간을 폰 화면에 다 욱여넣으면 시각 숫자가 겹쳐서, 한 시간을 고정 폭으로 두고
          가로로 넘겨(스와이프) 보게 한다. 기록이 없는 시간도 축에는 그대로 나온다. */}
      <div ref={scrollRef} className="mt-3 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="h-36" style={{ width: HOUR_W * 24 }}>
          <AreaChart
            width={HOUR_W * 24}
            height={144}
            data={series}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1d6d0" strokeDasharray="3 3" />
            {/* 축 숫자 대신 정상 범위를 옅은 띠로 깔아, 값이 높은지 낮은지 바로 보이게 한다 */}
            <ReferenceArea y1={normalRange.min} y2={normalRange.max} fill="#8fbf7a" fillOpacity={0.12} />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#806467"
              interval={0}
            />
            <YAxis hide domain={hasAnyValue ? ["auto", "auto"] : fallbackDomain} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #f1d6d0", fontSize: 12 }}
              formatter={(v) => [v == null ? "기록 없음" : `${v} ${unit}`, ""]}
              labelFormatter={(l) => `${l}시`}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${chartId})`} />
          </AreaChart>
        </div>
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

  // [일시 비활성 - 개발용] 홈 화면에 상주한 지 5초가 지나면 응급 화면으로 자동 이동하는 데모 기능.
  // 개발 중에는 홈에 5초만 머물러도 긴급 화면으로 튕겨서 작업이 어려우므로 잠시 꺼둔다.
  // 시연/발표 때 다시 켜려면 아래 useEffect 의 주석만 풀면 된다.
  // useEffect(() => {
  //   const timer = window.setTimeout(() => navigate("/guardian/emergency"), 5 * 1000)
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

        {/* 현재값 - 지금 상태를 좌우로 나란히 놓고 한눈에 비교 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">실시간 생체신호</h2>
          <div className="grid grid-cols-2 gap-3">
            <VitalValueCard
              icon={<Heart size={16} aria-hidden />}
              label="심박수"
              value={vitals.heartRate}
              unit="bpm"
              status={heartRateLevel(vitals.heartRate)}
              color="#dc2626"
            />
            <VitalValueCard
              icon={<Wind size={16} aria-hidden />}
              label="호흡수"
              value={vitals.respiration}
              unit="회/분"
              status={respirationLevel(vitals.respiration)}
              color="#d76773"
            />
          </div>
        </div>

        {/* 시간별 추이 - 그래프는 아래로 모아 둔다 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">시간별 추이</h2>
          <VitalTrendCard
            icon={<Heart size={16} aria-hidden />}
            label="심박수"
            unit="bpm"
            series={hourlyHeartRate}
            color="#dc2626"
            chartId="home-hr"
            fallbackDomain={[40, 140]}
            normalRange={HR_NORMAL}
          />
          <VitalTrendCard
            icon={<Wind size={16} aria-hidden />}
            label="호흡수"
            unit="회/분"
            series={hourlyRespiration}
            color="#d76773"
            chartId="home-rr"
            fallbackDomain={[0, 40]}
            normalRange={RR_NORMAL}
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
