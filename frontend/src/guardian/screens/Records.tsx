import { useEffect, useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, Bell } from "lucide-react"
import { Screen, TopBar } from "@/guardian/components/Screen"
import { BottomNav } from "@/guardian/components/BottomNav"
import { useGuardianData, useDailyVitals, type HourlyPoint, type VitalLevel } from "@/guardian/lib/api"
import { cn } from "@/guardian/lib/utils"

type Tab = "vitals" | "history"

function Chart({
  data,
  color,
  unit,
  fallbackDomain,
}: {
  data: HourlyPoint[]
  color: string
  unit: string
  /** 값이 하나도 없을 때 y축이 0~0 으로 뭉개지지 않도록 잡아 줄 기본 범위 */
  fallbackDomain: [number, number]
}) {
  const hasAnyValue = data.some((p) => p.value != null)
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* 24칸(00~23시)을 다 쓰면 숫자가 겹치므로 recharts 가 알아서 몇 개만 남긴다 */}
          <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={11} stroke="#806467" />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#806467"
            width={34}
            domain={hasAnyValue ? ["auto", "auto"] : fallbackDomain}
          />
          {/* formatter: 타입 표기(v: number)를 빼서 Recharts 가 주는 값을 그대로 받는다.
              값이 없는 시간(null)에 마우스를 올리면 "null bpm" 이 뜨므로 문구로 대체. */}
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #f1d6d0", fontSize: 12 }}
            formatter={(v) => [v == null ? "기록 없음" : `${v} ${unit}`, ""]}
            labelFormatter={(l) => `${l}시`}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#g-${color})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * 하루 요약 문구. 실제 기록에서 뽑아 쓴다.
 * 기록이 없는 날에 "안정적이었습니다"라고 하면, 측정이 멈춰 있었던 것을
 * 보호자가 "괜찮았다"로 오해한다. 그래서 기록 없음을 따로 구분한다.
 */
function daySummary(
  name: string,
  monthLabel: number,
  day: number,
  worstHeart: VitalLevel,
  worstResp: VitalLevel,
  loading: boolean,
): { tone: "none" | "normal" | "warn"; label: string; text: string } {
  // 아직 못 받아온 상태에서 "기록 없음"을 띄우면, 기록이 있는 날에도
  // 화면을 열자마자 "없습니다"가 잠깐 스쳐 보인다.
  if (loading) {
    return { tone: "none", label: "확인 중", text: "기록을 불러오고 있습니다." }
  }

  if (worstHeart === "기록 없음" && worstResp === "기록 없음") {
    return {
      tone: "none",
      label: "기록 없음",
      text: `${monthLabel}월 ${day}일에는 측정된 생체신호가 없습니다.`,
    }
  }

  const off: string[] = []
  if (worstHeart !== "정상" && worstHeart !== "기록 없음") off.push("심박수")
  if (worstResp !== "정상" && worstResp !== "기록 없음") off.push("호흡수")

  if (off.length === 0) {
    return {
      tone: "normal",
      label: "정상",
      text: `${name} 님은 ${monthLabel}월 ${day}일 하루 동안 안정적인 생체신호를 유지했습니다.`,
    }
  }

  return {
    tone: "warn",
    label: "주의",
    text: `${name} 님은 ${monthLabel}월 ${day}일에 ${off.join("·")}가 정상 범위를 벗어난 때가 있었습니다.`,
  }
}

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"]

// 이번 달 1일 ~ 말일 전체를 캘린더로 구성. 당일 이후 날짜는 아직 기록이 없으므로 비활성화.
function buildMonthDays(now: Date) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const lastDate = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDate }, (_, i) => {
    const d = i + 1
    return {
      d,
      w: WEEKDAY_LABEL[new Date(year, month, d).getDay()],
      future: d > today,
    }
  })
}

export default function Records() {
  const { patient, historyLog } = useGuardianData()
  const [tab, setTab] = useState<Tab>("vitals")
  // 렌더마다 new Date() 를 다시 만들면 아래 조회가 매번 다시 도는 것처럼 보이므로 한 번만 만든다
  const now = useState(() => new Date())[0]
  const monthLabel = now.getMonth() + 1
  const TODAY = now.getDate()
  const monthDays = useState(() => buildMonthDays(now))[0]
  const [selectedDay, setSelectedDay] = useState(TODAY)
  const calendarRef = useRef<HTMLDivElement>(null)

  // 캘린더에서 고른 날짜의 생체 기록. 날짜를 바꾸면 그 날짜로 다시 조회한다.
  const selectedDate = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), selectedDay),
    [now, selectedDay],
  )
  const daily = useDailyVitals(patient.patientId, selectedDate)

  const summary = daySummary(
    patient.name,
    monthLabel,
    selectedDay,
    daily.worstHeartLevel,
    daily.worstRespLevel,
    daily.loading,
  )

  // 당일이 캘린더 스크롤 영역의 가운데에 오도록 정렬.
  // offsetLeft 는 스크롤 컨테이너가 아니라 가장 가까운 위치지정 조상(.app-shell) 기준이라
  // 바깥 여백(px-5)만큼 어긋난다. 두 요소의 실제 화면 좌표 차이로 계산해야 정확하다.
  useEffect(() => {
    const container = calendarRef.current
    const todayEl = container?.querySelector<HTMLElement>('[data-today="true"]')
    if (!container || !todayEl) return
    const containerRect = container.getBoundingClientRect()
    const todayRect = todayEl.getBoundingClientRect()
    // 컨테이너 왼쪽 끝에서 today 까지의 거리 - (가운데로 보내기 위해 빼야 할 여백)
    const offsetInContainer = todayRect.left - containerRect.left
    const centerOffset = container.clientWidth / 2 - todayRect.width / 2
    container.scrollLeft += offsetInContainer - centerOffset
  }, [])

  return (
    <Screen>
      <TopBar title="기록" logo />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Tabs (이력 옵션 토글 - 상단 배치) */}
        <div className="flex gap-2 rounded-2xl bg-muted p-1">
          {[
            { key: "vitals", label: "생체신호 보고" },
            { key: "history", label: "알림·응급 이력" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={cn(
                "h-10 flex-1 rounded-xl text-sm font-semibold transition",
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 가로 캘린더 - 이번 달 1일~말일, 당일 이후는 아직 기록이 없어 비활성화 */}
        <div ref={calendarRef} className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {monthDays.map((day) => {
            const active = selectedDay === day.d
            return (
              <button
                key={day.d}
                data-today={day.d === TODAY}
                disabled={day.future}
                onClick={() => setSelectedDay(day.d)}
                aria-pressed={active}
                aria-disabled={day.future}
                className={cn(
                  "flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border transition",
                  day.future
                    ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground/40"
                    : active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className="text-xs font-medium">{day.w}</span>
                <span
                  className={cn(
                    "mt-0.5 text-lg font-bold",
                    day.future ? "" : active ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {day.d}
                </span>
              </button>
            )
          })}
        </div>

        {/* Status message - 고른 날짜의 실제 기록에서 뽑는다 */}
        <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {monthLabel}월 {selectedDay}일 상태 요약
          </p>
          <p className="mt-1 text-balance leading-relaxed text-foreground">
            <span
              className={cn(
                "font-bold",
                summary.tone === "normal"
                  ? "text-success"
                  : summary.tone === "warn"
                    ? "text-danger"
                    : "text-muted-foreground",
              )}
            >
              {summary.label}
            </span>{" "}
            · {summary.text}
          </p>
        </div>

        {tab === "vitals" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-foreground">심박수</p>
                <p className="text-sm text-muted-foreground">
                  {daily.heartRateAvg == null ? "기록 없음" : `평균 ${daily.heartRateAvg} bpm`}
                </p>
              </div>
              <Chart data={daily.heartRate} color="#dc2626" unit="bpm" fallbackDomain={[40, 140]} />
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-foreground">호흡수</p>
                <p className="text-sm text-muted-foreground">
                  {daily.respirationAvg == null ? "기록 없음" : `평균 ${daily.respirationAvg} 회/분`}
                </p>
              </div>
              <Chart data={daily.respiration} color="#d76773" unit="회/분" fallbackDomain={[0, 40]} />
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {historyLog.map((h) => {
              const urgent = h.type === "urgent"
              return (
                <li
                  key={h.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4",
                    urgent ? "border-danger/30 bg-danger/5" : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      urgent ? "bg-danger/15 text-danger" : "bg-muted text-primary",
                    )}
                  >
                    {urgent ? <AlertTriangle size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{h.title}</span>
                    <span className="block text-xs text-muted-foreground">{h.date}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <BottomNav />
    </Screen>
  )
}
