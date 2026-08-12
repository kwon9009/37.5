import { useEffect, useState } from "react"
import { Phone } from "lucide-react"
import { cn } from "@/guardian/lib/utils"
import {
  fetchHospitalByCode,
  getRegisteredHospitalCode,
  telHref,
  type HospitalInfo,
} from "@/guardian/lib/hospitals"

/**
 * 등록해 둔 병원으로 전화를 거는 버튼.
 *
 * 바로 걸지 않고 번호를 먼저 보여주는 이유:
 *   응급 상황에서 급하게 누르다 잘못 눌러 전화가 걸리면 당황하게 된다.
 *   어디로 거는지(병원 이름)와 번호를 확인하고 누르도록 한 단계 둔다.
 *   보호자가 나중에 직접 저장해 두고 싶을 수도 있어 번호를 그대로 보여준다.
 */

type State =
  | { kind: "loading" }
  | { kind: "ready"; hospital: HospitalInfo; phone: string }
  | { kind: "no-phone"; hospital: HospitalInfo }
  | { kind: "no-hospital" }

export function HospitalCallButton({ className }: { className?: string }) {
  const [state, setState] = useState<State>({ kind: "loading" })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true

    const code = getRegisteredHospitalCode()

    if (!code) {
      setState({ kind: "no-hospital" })
      return
    }

    fetchHospitalByCode(code)
      .then((hospital) => {
        if (!alive) return
        if (!hospital) return setState({ kind: "no-hospital" })
        setState(
          hospital.phone
            ? { kind: "ready", hospital, phone: hospital.phone }
            : { kind: "no-phone", hospital },
        )
      })
      .catch(() => {
        if (alive) setState({ kind: "no-hospital" })
      })

    return () => {
      alive = false
    }
  }, [])

  const disabled = state.kind !== "ready"

  const label =
    state.kind === "loading"
      ? "번호 확인 중…"
      : state.kind === "no-phone"
        ? "등록된 번호가 없습니다"
        : state.kind === "no-hospital"
          ? "병원 정보가 없습니다"
          : "병원 연락하기"

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-danger-foreground",
          disabled && "opacity-50",
          className,
        )}
      >
        <Phone size={20} aria-hidden />
        {label}
      </button>

      {open && state.kind === "ready" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/50 px-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-title"
        >
          <div className="fade-up w-full rounded-3xl bg-card p-6 text-center shadow-xl">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
              <Phone size={28} aria-hidden />
            </span>

            <h2 id="call-title" className="text-lg font-bold text-foreground">
              병원에 전화할까요?
            </h2>

            <p className="mt-3 text-balance break-keep text-sm text-muted-foreground">
              {state.hospital.name}
            </p>

            {/* 번호는 크게 보여준다. 보호자가 직접 저장해 두거나
                다른 기기로 걸 수도 있어야 한다. */}
            <p className="mt-1 text-xl font-bold tracking-wide text-foreground">
              {state.phone}
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 flex-1 rounded-2xl border border-border text-sm font-semibold text-foreground"
              >
                취소
              </button>
              <a
                href={telHref(state.phone)}
                onClick={() => setOpen(false)}
                className="grid h-12 flex-1 place-items-center rounded-2xl bg-danger text-sm font-semibold text-danger-foreground"
              >
                전화
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
