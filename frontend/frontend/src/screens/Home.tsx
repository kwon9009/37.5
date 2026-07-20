import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Wind, UserCheck, UserX, Phone, FileText, X, AlertTriangle } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { patient, vitals, notifications, specialNote } from "@/lib/data"

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
  const [showNote, setShowNote] = useState(false)
  const urgentCount = notifications.filter((n) => n.type === "urgent").length

  return (
    <Screen>
      <TopBar title="37.5°C" logo bell bellCount={notifications.length} />
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
            onClick={() => navigate("/emergency")}
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
            <a
              href="tel:0000000000"
              className="flex flex-col items-center rounded-3xl border border-border bg-card p-4 text-center shadow-sm"
            >
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Phone size={20} aria-hidden />
              </span>
              <span className="font-semibold text-foreground">병원 연락</span>
            </a>

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
            aria-label="특이사항"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">특이사항</h3>
              <button
                aria-label="닫기"
                onClick={() => setShowNote(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <p className="leading-relaxed text-foreground">{specialNote}</p>
            <button
              onClick={() => setShowNote(false)}
              className="mt-6 h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </Screen>
  )
}
