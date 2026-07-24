import { useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, Bell } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { patient, heartRateSeries, respirationSeries, historyLog } from "@/lib/data"
import { cn } from "@/lib/utils"

type Tab = "vitals" | "history"

function Chart({ data, color, unit }: { data: { t: string; value: number }[]; color: string; unit: string }) {
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
          <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={11} stroke="#806467" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#806467" width={34} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #f1d6d0", fontSize: 12 }}
            formatter={(v: number) => [`${v} ${unit}`, ""]}
            labelFormatter={(l) => `${l}시`}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#g-${color})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// 가로 캘린더용 데모 날짜 (7월 8일 ~ 14일)
const weekDays = [
  { w: "월", d: 8 },
  { w: "화", d: 9 },
  { w: "수", d: 10 },
  { w: "목", d: 11 },
  { w: "금", d: 12 },
  { w: "토", d: 13 },
  { w: "일", d: 14 },
]

export default function Records() {
  const [tab, setTab] = useState<Tab>("vitals")
  const [selectedDay, setSelectedDay] = useState(14)

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

        {/* 가로 캘린더 */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day) => {
            const active = selectedDay === day.d
            return (
              <button
                key={day.d}
                onClick={() => setSelectedDay(day.d)}
                aria-pressed={active}
                className={cn(
                  "flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className="text-xs font-medium">{day.w}</span>
                <span className={cn("mt-0.5 text-lg font-bold", active ? "text-primary-foreground" : "text-foreground")}>
                  {day.d}
                </span>
              </button>
            )
          })}
        </div>

        {/* Status message */}
        <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">7월 {selectedDay}일 상태 요약</p>
          <p className="mt-1 text-balance leading-relaxed text-foreground">
            <span className="font-bold text-success">정상</span> · {patient.name} 님은 7월 {selectedDay}일 하루 동안 안정적인 생체신호를 유지했습니다.
          </p>
        </div>

        {tab === "vitals" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-foreground">심박수</p>
                <p className="text-sm text-muted-foreground">평균 76 bpm</p>
              </div>
              <Chart data={heartRateSeries} color="#dc2626" unit="bpm" />
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-foreground">호흡수</p>
                <p className="text-sm text-muted-foreground">평균 15 회/분</p>
              </div>
              <Chart data={respirationSeries} color="#d76773" unit="회/분" />
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
