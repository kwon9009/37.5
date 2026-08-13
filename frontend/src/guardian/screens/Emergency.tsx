import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, BookOpen, Heart, Wind, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/guardian/lib/utils"
import { Screen } from "@/guardian/components/Screen"
import { useGuardianData } from "@/guardian/lib/api"

export default function Emergency() {
  const navigate = useNavigate()
  const { patient, emergencyEvent } = useGuardianData()
  const [countdown, setCountdown] = useState(5)
  const [muted, setMuted] = useState(false)
  // 브라우저 자동재생 정책으로 경고음이 막힌 상태
  const [blocked, setBlocked] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  // 응급 경고음: Web Audio API 로 삐-삐 반복음 재생
  useEffect(() => {
    if (muted) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const AudioCtx =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    // 닫힌 AudioContext 는 resume 할 수 없으므로 새로 생성해서 사용
    let ctx = audioCtxRef.current
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioCtx()
      audioCtxRef.current = ctx
    }
    const active = ctx
    let cancelled = false

    function beep() {
      if (active.state !== "running") return
      const osc = active.createOscillator()
      const gain = active.createGain()
      osc.type = "square"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, active.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.25, active.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, active.currentTime + 0.35)
      osc.connect(gain).connect(active.destination)
      osc.start()
      osc.stop(active.currentTime + 0.36)
    }

    function start() {
      if (cancelled || active.state !== "running") return
      setBlocked(false)
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      beep()
      intervalRef.current = window.setInterval(beep, 900)
    }

    // 자동재생 정책으로 resume 이 막히면 첫 사용자 상호작용에서 다시 시도
    function tryResume() {
      active
        .resume()
        .then(start)
        .catch(() => setBlocked(true))
    }

    tryResume()
    if (active.state !== "running") setBlocked(true)
    window.addEventListener("pointerdown", tryResume)
    window.addEventListener("keydown", tryResume)

    return () => {
      cancelled = true
      window.removeEventListener("pointerdown", tryResume)
      window.removeEventListener("keydown", tryResume)
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [muted])

  // 화면 이탈 시 오디오 정리 (닫은 컨텍스트를 재사용하지 않도록 ref 초기화)
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      const ctx = audioCtxRef.current
      audioCtxRef.current = null
      if (ctx && ctx.state !== "closed") void ctx.close()
    }
  }, [])

  // 심박/호흡 이상을 나눠서 안내 문구 구성
  const abnormalLabels = [
    emergencyEvent.heartAbnormal && "심박수",
    emergencyEvent.respAbnormal && "호흡수",
  ].filter(Boolean) as string[]
  const abnormalText =
    abnormalLabels.length > 0 ? `${abnormalLabels.join("·")} 이상이 감지되었습니다.` : "이상 징후가 감지되었습니다."

  return (
    <Screen className="bg-danger text-danger-foreground">
      {/* 세로 가운데 정렬을 justify-center 로 하면, 내용이 화면보다 길어졌을 때
          넘친 부분이 스크롤 시작점보다 위로 밀려나 "영영 볼 수 없게" 잘린다.
          그래서 정렬은 안쪽 래퍼의 m-auto 로 한다. m-auto 는 남는 공간이 있을 때만
          가운데로 밀고, 공간이 없으면 자동으로 위쪽 정렬이 되어 전부 스크롤된다. */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-8 py-8 text-center">
        <div className="m-auto flex w-full flex-col items-center">
        <div className="relative mb-6">
          <span className="pulse-ring absolute inset-0 rounded-full bg-danger-foreground/40" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-danger-foreground/20">
            <AlertTriangle size={48} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <h1 className="text-3xl font-bold">긴급 상황 발생</h1>
        {/* break-keep: 한글은 기본값이면 "환자입니다" 가 "환자 / 입니다" 처럼
            단어 중간에서 줄바꿈된다. 띄어쓰기 단위로만 끊기게 한다. */}
        <p className="mt-3 text-balance break-keep text-lg font-semibold text-danger-foreground/90">
          {patient.name} 님의 {abnormalText}
        </p>
        <p className="mt-2 text-balance break-keep leading-relaxed text-danger-foreground/80">
          심장질환 이력이 있는 환자입니다. 아래 생체신호를 확인하고 즉시 대응해 주세요.
        </p>

        {/* 실시간 생체신호 확인.
            응급 화면에서 보호자가 병원에 알려야 할 값이라 화면에서 가장 크게 둔다.
            숫자만 가운데 오도록 단위는 아래로 내렸다(자릿수가 바뀌어도 안 흔들림). */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div
            className={cn(
              "flex flex-col items-center rounded-2xl px-3 py-5 transition",
              emergencyEvent.heartAbnormal
                ? "bg-danger-foreground text-danger ring-2 ring-danger-foreground"
                : "bg-danger-foreground/15",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Heart size={18} aria-hidden />
              <span
                className={cn(
                  "text-sm font-semibold",
                  emergencyEvent.heartAbnormal ? "text-danger/70" : "text-danger-foreground/80",
                )}
              >
                심박수
              </span>
            </span>
            <span className="mt-2 text-5xl font-bold leading-none">{emergencyEvent.heartRate}</span>
            <span
              className={cn(
                "mt-1.5 text-sm font-medium",
                emergencyEvent.heartAbnormal ? "text-danger/70" : "text-danger-foreground/80",
              )}
            >
              bpm
            </span>
            {emergencyEvent.heartAbnormal && (
              <span className="mt-2 rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-danger-foreground">
                {emergencyEvent.heartStatus}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex flex-col items-center rounded-2xl px-3 py-5 transition",
              emergencyEvent.respAbnormal
                ? "bg-danger-foreground text-danger ring-2 ring-danger-foreground"
                : "bg-danger-foreground/15",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Wind size={18} aria-hidden />
              <span
                className={cn(
                  "text-sm font-semibold",
                  emergencyEvent.respAbnormal ? "text-danger/70" : "text-danger-foreground/80",
                )}
              >
                호흡수
              </span>
            </span>
            <span className="mt-2 text-5xl font-bold leading-none">{emergencyEvent.respiration}</span>
            <span
              className={cn(
                "mt-1.5 text-sm font-medium",
                emergencyEvent.respAbnormal ? "text-danger/70" : "text-danger-foreground/80",
              )}
            >
              회/분
            </span>
            {emergencyEvent.respAbnormal && (
              <span className="mt-2 rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-danger-foreground">
                {emergencyEvent.respStatus}
              </span>
            )}
          </div>
        </div>

        {/* 경고음 음소거 토글 */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="mt-4 flex items-center gap-2 rounded-full bg-danger-foreground/15 px-4 py-2 text-sm font-medium"
          aria-pressed={muted}
        >
          {muted ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
          {muted ? "경고음 꺼짐" : "경고음 켜짐"}
        </button>
        {!muted && blocked && (
          <p className="mt-2 text-xs font-medium text-danger-foreground/80" role="status">
            화면을 한 번 터치하면 경고음이 재생됩니다.
          </p>
        )}
        </div>
      </div>

      <div className="shrink-0 space-y-3 px-6 pb-10">
        <button
          onClick={() => navigate("/guardian/emergency/guide")}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-danger-foreground font-semibold text-danger"
        >
          <BookOpen size={20} aria-hidden />
          응급 대응 가이드 이동
        </button>
        <button
          disabled={countdown > 0}
          onClick={() => navigate("/guardian/home")}
          className="h-12 w-full text-sm font-medium text-danger-foreground/80 disabled:text-danger-foreground/50"
        >
          {countdown > 0 ? `${countdown}초 뒤 홈화면으로 이동 가능` : "홈화면으로"}
        </button>
      </div>
    </Screen>
  )
}
