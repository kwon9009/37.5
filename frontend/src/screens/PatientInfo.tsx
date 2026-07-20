import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Screen, TopBar } from "@/components/Screen"
import { Button, Field } from "@/components/ui"
import { cn } from "@/lib/utils"

const ITEM_H = 40 // 다이얼 각 항목 높이(px)

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

type WheelProps = {
  values: number[]
  value: number
  suffix: string
  onChange: (v: number) => void
  ariaLabel: string
}

function Wheel({ values, value, suffix, onChange, ariaLabel }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)

  // 열릴 때 현재 선택값 위치로 스크롤 정렬
  useEffect(() => {
    const idx = values.indexOf(value)
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H
    }
    // 최초 마운트 시 1회만 정렬
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll() {
    if (!ref.current) return
    if (timer.current) window.clearTimeout(timer.current)
    const el = ref.current
    timer.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(values.length - 1, idx))
      const next = values[clamped]
      if (next !== value) onChange(next)
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" })
    }, 90)
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="relative h-50 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth"
      style={{ scrollbarWidth: "none" }}
    >
      {/* 위/아래 패딩으로 첫·마지막 항목이 가운데 정렬되게 함 (5줄 높이 → 위아래 2줄) */}
      <div style={{ height: ITEM_H * 2 }} aria-hidden />
      {values.map((v) => {
        const selected = v === value
        return (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => {
              onChange(v)
              ref.current?.scrollTo({ top: values.indexOf(v) * ITEM_H, behavior: "smooth" })
            }}
            className={cn(
              "flex w-full snap-center items-center justify-center text-sm transition",
              selected ? "font-bold text-foreground" : "text-muted-foreground/60",
            )}
            style={{ height: ITEM_H }}
          >
            {v}
            {suffix}
          </button>
        )
      })}
      <div style={{ height: ITEM_H * 2 }} aria-hidden />
    </div>
  )
}

export default function PatientInfo() {
  const navigate = useNavigate()
  const [gender, setGender] = useState<"male" | "female" | null>(null)
  const [showDial, setShowDial] = useState(false)

  const now = new Date()
  const [year, setYear] = useState(1950)
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = now.getFullYear(); y >= 1920; y--) arr.push(y)
    return arr
  }, [now])
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  const days = useMemo(() => {
    const max = daysInMonth(year, month)
    if (day > max) setDay(max)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [year, month, day])

  const birthLabel = `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`

  return (
    <Screen>
      <TopBar title="환자 정보 확인" back />
      <form
        className="flex flex-1 flex-col overflow-y-auto"
        onSubmit={(e) => {
          e.preventDefault()
          navigate("/hospital")
        }}
      >
        <div className="flex-1 space-y-5 px-5 py-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">환자 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">모니터링할 환자의 기본 정보입니다.</p>
          </div>

          <Field id="pname" label="환자 성명" placeholder="환자 성명을 입력하세요" required />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">환자 성별</span>
            <div className="flex gap-2">
              {[
                { key: "male", label: "남성" },
                { key: "female", label: "여성" },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGender(g.key as "male" | "female")}
                  className={cn(
                    "h-13 flex-1 rounded-2xl border text-sm font-semibold transition",
                    gender === g.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 - 토글로 다이얼 열기 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">환자 생년월일</span>
            <button
              type="button"
              onClick={() => setShowDial((s) => !s)}
              aria-expanded={showDial}
              className={cn(
                "flex h-13 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition",
                showDial ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground",
              )}
            >
              <span>{birthLabel}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {showDial ? "닫기" : "선택"}
              </span>
            </button>

            {showDial && (
              <div className="mt-2 rounded-2xl border border-border bg-card p-2">
                <div className="relative flex">
                  {/* 가운데 선택 표시선 */}
                  <div
                    className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary/12"
                    style={{ height: ITEM_H }}
                    aria-hidden
                  />
                  <Wheel values={years} value={year} suffix="년" onChange={setYear} ariaLabel="년 선택" />
                  <Wheel values={months} value={month} suffix="월" onChange={setMonth} ariaLabel="월 선택" />
                  <Wheel values={days} value={day} suffix="일" onChange={setDay} ariaLabel="일 선택" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-border bg-card px-5 py-4">
          <Button type="submit">확인하기</Button>
        </div>
      </form>
    </Screen>
  )
}
