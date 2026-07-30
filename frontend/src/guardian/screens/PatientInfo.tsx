import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Phone, Building2, CheckCircle2 } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/guardian/components/Screen"
import { Button, Field } from "@/guardian/components/ui"
import { cn } from "@/guardian/lib/utils"
import { findHospitalByCode, type HospitalInfo } from "@/guardian/lib/hospitals"

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

  // 환자 성명: 완성된 한글만 허용 (잘못 입력 시 흔들림 모션)
  const [pname, setPname] = useState("")
  const [pnameWarning, setPnameWarning] = useState("")
  const [pnameShake, setPnameShake] = useState(false)

  // 병원 코드 등록
  const [code, setCode] = useState("")
  const [hospital, setHospital] = useState<HospitalInfo | null>(null)
  const [codeWarning, setCodeWarning] = useState("")
  const [codeShake, setCodeShake] = useState(false)

  // 최종 확인 다이얼로그
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  // 완성된 한글만 허용: blur 시와 제출 시 모두 동일하게 검사 (엔터로 바로 제출하는 경우도 포함)
  function validatePname() {
    if (!pname) return true
    if (!/^[가-힣]{2,}$/.test(pname)) {
      setPnameWarning("완성된 성명만 입력할 수 있습니다. 다시 입력해 주세요.")
      setPnameShake(true)
      setPname("")
      return false
    }
    setPnameWarning("")
    return true
  }

  function handlePnameBlur() {
    validatePname()
  }

  // 병원 코드 확인 → 병원명/주소/지도 확장 표시
  function handleCodeCheck() {
    const found = findHospitalByCode(code)
    if (!found) {
      setHospital(null)
      setCodeWarning("등록되지 않은 병원 코드입니다. 다시 확인해 주세요.")
      setCodeShake(true)
      setCode("")
      return
    }
    setHospital(found)
    setCodeWarning("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pname) {
      setPnameShake(true)
      return
    }
    if (!validatePname()) {
      return
    }
    if (!hospital) {
      setCodeWarning("병원 코드를 등록해 주세요.")
      setCodeShake(true)
      return
    }
    setConfirmOpen(true)
  }

  return (
    <Screen>
      <TopBar title="환자 정보 확인" back />
      <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <StickyAction className="space-y-5 px-5 py-6" action={<Button type="submit">확인하기</Button>}>
          <div>
            <h2 className="text-lg font-bold text-foreground">환자 정보를 입력해 주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">모니터링할 환자의 기본 정보입니다.</p>
          </div>

          <div>
            <Field
              id="pname"
              label="환자 성명"
              placeholder="환자 성명을 입력하세요"
              value={pname}
              onChange={(e) => {
                setPname(e.target.value)
                setPnameWarning("")
              }}
              onBlur={handlePnameBlur}
              onAnimationEnd={() => setPnameShake(false)}
              className={cn(pnameShake && "verify-shake", pnameWarning && "verify-error-border")}
            />
            {pnameWarning && (
              <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
                {pnameWarning}
              </p>
            )}
          </div>

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
              <span className="text-xs font-medium text-muted-foreground">{showDial ? "닫기" : "선택"}</span>
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

          {/* 병원 코드 등록 - 코드 확인 시 병원명/주소/지도가 아래로 확장 */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted-foreground">병원 코드 등록</span>
            <div className="flex w-full items-stretch gap-2">
              <input
                id="hospital-code"
                aria-label="병원 코드"
                placeholder="예: DJ1001"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setCodeWarning("")
                }}
                onAnimationEnd={() => setCodeShake(false)}
                className={cn(
                  "h-13 min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 text-base tracking-wide text-foreground outline-none placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20",
                  codeShake && "verify-shake",
                  codeWarning && "verify-error-border",
                )}
              />
              <Button
                type="button"
                variant={hospital ? "muted" : "primary"}
                className="h-13 w-28 shrink-0 whitespace-nowrap px-0 text-sm"
                onClick={handleCodeCheck}
              >
                {hospital ? "등록됨" : "확인"}
              </Button>
            </div>
            {codeWarning && (
              <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
                {codeWarning}
              </p>
            )}
            {!codeWarning && !hospital && (
              <p className="mt-1.5 text-xs text-muted-foreground">병원에서 안내받은 코드를 입력해 주세요.</p>
            )}

            {/* 확장 영역: 병원명 · 주소 · 지도 */}
            {hospital && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                    <Building2 size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{hospital.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} aria-hidden />
                      {hospital.address}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone size={12} aria-hidden />
                      {hospital.phone}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                    <CheckCircle2 size={14} aria-hidden />
                    확인
                  </span>
                </div>

                {/* Google Maps API 연결 지점 (플레이스홀더)
                    실제 연동 시: <GoogleMap center={{lat,lng}} /> 로 교체하고
                    VITE_GOOGLE_MAPS_API_KEY 환경변수를 사용합니다. */}
                <div className="relative h-40 border-t border-border bg-muted/50">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                    aria-hidden
                  />
                  <span
                    className="absolute -translate-x-1/2 -translate-y-full text-primary"
                    style={{ left: `${hospital.x}%`, top: `${hospital.y}%` }}
                  >
                    <MapPin size={30} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="absolute bottom-2 right-3 rounded-full bg-card/90 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    Google Maps 연동 영역
                  </span>
                </div>
              </div>
            )}
          </div>
        </StickyAction>
      </form>

      {/* 환자 확인 다이얼로그 - 승인 대기 화면으로 넘어가기 전 최종 확인 */}
      {confirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/50 px-8">
          <div role="dialog" aria-modal="true" className="w-full rounded-3xl bg-card p-6 text-center shadow-xl">
            <h3 className="text-lg font-bold text-foreground">정말 이 환자가 맞습니까?</h3>
            <dl className="mt-4 space-y-2 text-left">
              {[
                ["성명", pname],
                ["성별", gender === "male" ? "남성" : gender === "female" ? "여성" : "미선택"],
                ["생년월일", birthLabel],
                ["병원", hospital?.name ?? "-"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-12 flex-1 rounded-2xl border border-border text-sm font-semibold text-foreground"
              >
                다시 확인
              </button>
              <button
                type="button"
                onClick={() => navigate("/guardian/waiting")}
                className="h-12 flex-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                맞습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}
