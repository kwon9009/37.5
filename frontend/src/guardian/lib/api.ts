import { useEffect, useRef, useState } from "react"
import { apiClient } from "@/api/client.js"
import { openVitalStream } from "@/api/vital-stream.js"
import { pollInterval } from "@/api/use-vital-stream.js"
import type { NotiType } from "./schema-view"

export type Noti = {
  id: number
  type: NotiType
  title: string
  time: string
}

export type HistoryItem = {
  id: number
  type: NotiType
  title: string
  date: string
}

export type GuardianData = {
  loading: boolean
  /** 심박·호흡이 실시간 스트림(SSE)으로 들어오고 있는지 */
  realtime: boolean
  patient: {
    patientId: number | null
    name: string
    guardian: string
    relation: string
    hospital: string
    room: string
  }
  vitals: {
    heartRate: number
    respiration: number
    present: boolean
  }
  emergencyEvent: {
    heartRate: number
    respiration: number
    eventType: string
    heartAbnormal: boolean
    respAbnormal: boolean
    heartStatus: string
    respStatus: string
  }
  notifications: Noti[]
  specialNote: string
  heartRateSeries: { t: string; value: number }[]
  respirationSeries: { t: string; value: number }[]
  historyLog: HistoryItem[]
}

// ── 생체신호 판정 기준 ─────────────────────────────────────────────
//            매우 낮음    낮음      정상      높음       매우 높음
//   심박수    ≤40        41~59    60~100   101~130    ≥131
//   호흡수    ≤8         9~11     12~20    21~24      ≥25
//
// 정상 범위는 성인 안정시 표준값(심박 60~100, 호흡 12~16)을 쓴다.
// 바깥쪽 "매우" 경계는 병동에서 환자 악화를 조기에 잡을 때 쓰는
// NEWS2(National Early Warning Score 2, 영국 왕립내과의사회)에서
// 가장 위험한 구간(3점)으로 잡았다 — 심박 ≤40 / ≥131, 호흡 ≤8 / ≥25.
// 즉 "정상"은 교과서 기준, "매우 낮음·매우 높음"은 병원 경보 기준이다.
//
// 주의: 이 등급은 참고용 선별(screening) 표시이지 진단이 아니다.
//       최종 판단은 의료진이 한다.
export type VitalLevel = "매우 낮음" | "낮음" | "정상" | "높음" | "매우 높음" | "기록 없음"

/** 등급 경계값. 각 칸은 "이 값 이하까지 이 등급"을 뜻한다. */
const HR_CUTS = { veryLow: 40, low: 59, normal: 100, high: 130 }
const RR_CUTS = { veryLow: 8, low: 11, normal: 20, high: 24 }

// 정상 범위(그래프의 초록 띠, 이상 여부 판정에 사용).
// 위 등급표의 "정상" 칸에서 그대로 끌어온다 — 표와 띠가 어긋나지 않게 하기 위함.
export const HR_NORMAL = { min: HR_CUTS.low + 1, max: HR_CUTS.normal }
export const RR_NORMAL = { min: RR_CUTS.low + 1, max: RR_CUTS.normal }

type Range = { min: number; max: number }
type Cuts = { veryLow: number; low: number; normal: number; high: number }

function isAbnormal(value: number, range: Range): boolean {
  return value < range.min || value > range.max
}

function classify(value: number, cuts: Cuts): VitalLevel {
  // 0 이하는 측정값이 아니라 "아직 안 들어옴"이다.
  // 이걸 매우 낮음으로 보여주면 멀쩡한 환자가 위독한 것처럼 보인다.
  if (!value || value <= 0) return "기록 없음"
  if (value <= cuts.veryLow) return "매우 낮음"
  if (value <= cuts.low) return "낮음"
  if (value <= cuts.normal) return "정상"
  if (value <= cuts.high) return "높음"
  return "매우 높음"
}

export function heartRateLevel(value: number): VitalLevel {
  return classify(value, HR_CUTS)
}

export function respirationLevel(value: number): VitalLevel {
  return classify(value, RR_CUTS)
}

function relativeTime(sentAt: string): string {
  const diffMs = Date.now() - new Date(sentAt).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "방금 전"
  if (min < 60) return `${min}분 전`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.round(hr / 24)}일 전`
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi}`
}

/**
 * 기록 시각을 "HH"(00~23)로 바꾼다. 반드시 로컬 시각 기준이어야 한다.
 *
 * 서버는 시간대 표시가 없는 시각(예: 2026-08-17T17:30:01)을 주는데,
 * 여기에 toISOString()을 쓰면 한국 시각을 UTC로 바꿔버려 9시간이 밀린다.
 * (17시 기록이 "08"시로 표시되던 원인)
 */
function hourLabel(iso: string): string {
  return String(new Date(iso).getHours()).padStart(2, "0")
}

/**
 * 서버에 넘길 날짜 문자열(YYYY-MM-DD)을 로컬 기준으로 만든다.
 * toISOString().slice(0,10) 을 쓰면 UTC 기준이라 한국 시간 오전 9시 이전에는
 * 날짜가 하루 전으로 어긋난다.
 */
export function toDateParam(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export type HourlyPoint = { t: string; value: number | null }

/**
 * 서버가 주는 값은 1분 평균 로그라서 하루치면 1440개가 된다.
 * 그대로 그리면 점이 너무 많아 읽기 어렵고 "시간당"도 아니므로,
 * 같은 시(00~23)끼리 평균 내어 24개(=하루치)로 줄인다.
 *
 * 00~23시 뼈대를 먼저 깔고 값을 채운다. 기록이 있는 시간만 넣으면 방금 켠 경우
 * 점이 하나만 찍혀 "지금 시각"만 있는 것처럼 보인다. 기록이 없는 시간도 축에는
 * 나와야 하루 흐름을 읽을 수 있다(값은 null → 선이 끊김).
 */
export function toHourlySeries(series: { t: string; value: number }[]): HourlyPoint[] {
  const sum = new Map<string, { total: number; count: number }>()
  for (const point of series) {
    if (point.value == null) continue
    const acc = sum.get(point.t) ?? { total: 0, count: 0 }
    acc.total += point.value
    acc.count += 1
    sum.set(point.t, acc)
  }
  return Array.from({ length: 24 }, (_, hour) => {
    const t = String(hour).padStart(2, "0")
    const acc = sum.get(t)
    return { t, value: acc ? Math.round(acc.total / acc.count) : null }
  })
}

const EMPTY: GuardianData = {
  loading: true,
  realtime: false,
  patient: { patientId: null, name: "-", guardian: "-", relation: "-", hospital: "-", room: "-" },
  vitals: { heartRate: 0, respiration: 0, present: false },
  emergencyEvent: {
    heartRate: 0,
    respiration: 0,
    eventType: "cardiac",
    heartAbnormal: false,
    respAbnormal: false,
    heartStatus: "정상",
    respStatus: "정상",
  },
  notifications: [],
  specialNote: "",
  heartRateSeries: [],
  respirationSeries: [],
  historyLog: [],
}

// 보호자 앱 전 화면이 공유하는 실데이터 훅. /guardians/me로 담당 환자를 찾고,
// 그 환자의 상세/생체로그/알림/응급기록을 한 번에 불러와 화면용 모양으로 가공한다.
export function useGuardianData(): GuardianData {
  const [data, setData] = useState<GuardianData>(EMPTY)
  // 스트림으로 들어온 심박·호흡. 폴링 결과가 덮어쓰지 않도록 따로 들고 있다가
  // 화면에 돌려줄 때 합친다.
  const [liveVitals, setLiveVitals] = useState<GuardianData["vitals"] | null>(null)
  const [realtime, setRealtime] = useState(false)
  // 스트림 값이 아직 없을 때 기준으로 삼을 마지막 폴링값
  const polledVitals = useRef(EMPTY.vitals)
  const patientId = data.patient.patientId

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: me } = await apiClient.get("/guardians/me")
        const myPatient = me.patients?.[0]
        if (!myPatient) {
          if (!cancelled) setData((prev) => ({ ...prev, loading: false }))
          return
        }

        const [detailRes, vitalLogsRes, alertsRes, emergencyRes] = await Promise.all([
          apiClient.get(`/patients/${myPatient.patient_id}`),
          // 홈 화면 그래프는 "오늘 00~23시"를 그리므로 오늘 하루치만 받는다.
          // 날짜를 안 넘기면 최근 24시간이 와서 어제 저녁 값이 오늘 저녁 칸에 섞인다.
          apiClient.get(`/patients/${myPatient.patient_id}/vital-logs`, {
            params: { date: toDateParam(new Date()) },
          }),
          apiClient.get(`/patients/${myPatient.patient_id}/alerts`),
          apiClient.get(`/patients/${myPatient.patient_id}/emergency-logs`),
        ])

        if (cancelled) return

        const detail = detailRes.data
        const vitalLogs = vitalLogsRes.data.vital_logs as { avg_heart_rate: number; avg_resp_rate: number; recorded_at: string }[]
        const alerts = alertsRes.data.alerts as { alert_id: number; message: string; is_read: boolean; sent_at: string }[]
        const emergencyLogs = emergencyRes.data.emergency_logs as {
          heart_rate: number
          resp_rate: number
          event_type: string
          created_at: string
        }[]

        const latestEmergency = [...emergencyLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
        const evHeart = latestEmergency?.heart_rate ?? detail.current_vital?.heart_rate ?? 0
        const evResp = latestEmergency?.resp_rate ?? detail.current_vital?.resp_rate ?? 0
        const heartAbnormal = isAbnormal(evHeart, HR_NORMAL)
        const respAbnormal = isAbnormal(evResp, RR_NORMAL)

        const notifications: Noti[] = [...alerts]
          .sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1))
          .map((a) => ({
            id: a.alert_id,
            type: (a.is_read ? "normal" : "urgent") as NotiType,
            title: a.message,
            time: relativeTime(a.sent_at),
          }))

        const historyLog: HistoryItem[] = [
          ...emergencyLogs.map((e, index) => ({
            id: 10000 + index,
            type: "urgent" as NotiType,
            title: `심박수 이상 감지 · 심박 ${e.heart_rate} / 호흡 ${e.resp_rate}`,
            date: shortDate(e.created_at),
          })),
          ...alerts.map((a) => ({
            id: a.alert_id,
            type: (a.is_read ? "normal" : "urgent") as NotiType,
            title: a.message,
            date: shortDate(a.sent_at),
          })),
        ].sort((a, b) => (a.date < b.date ? 1 : -1))

        polledVitals.current = {
          heartRate: detail.current_vital?.heart_rate ?? 0,
          respiration: detail.current_vital?.resp_rate ?? 0,
          present: myPatient.is_present,
        }

        setData({
          loading: false,
          realtime: false, // 실제 값은 아래 return에서 채운다
          patient: {
            patientId: myPatient.patient_id,
            name: myPatient.name,
            guardian: me.name,
            relation: myPatient.relation,
            hospital: detail.patient.hospital,
            room: `${myPatient.room_num}호`,
          },
          vitals: polledVitals.current,
          emergencyEvent: {
            heartRate: evHeart,
            respiration: evResp,
            eventType: latestEmergency?.event_type ?? "cardiac",
            heartAbnormal,
            respAbnormal,
            heartStatus: heartRateLevel(evHeart),
            respStatus: respirationLevel(evResp),
          },
          notifications,
          specialNote: detail.patient.special_notes ?? "",
          heartRateSeries: vitalLogs.map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_heart_rate })),
          respirationSeries: vitalLogs.map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_resp_rate })),
          historyLog,
        })
      } catch {
        if (!cancelled) setData((prev) => ({ ...prev, loading: false }))
      }
    }

    load()
    // 알림·기록처럼 스트림으로 오지 않는 값만 주기적으로 따라잡는다
    const timer = setInterval(load, pollInterval(realtime))
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [realtime])

  // 심박·호흡은 서버가 센서 값을 받는 즉시 밀어준다(폴링 간격을 기다리지 않음)
  useEffect(() => {
    if (patientId == null) return

    return openVitalStream({
      scope: "patient",
      patientId,
      onVitals: (payload) => {
        setLiveVitals((prev) => {
          const base = prev ?? polledVitals.current
          return {
            // null이면 "이번엔 갱신할 값이 없음"(부재중·안정화중·측정오류)이라는 뜻이라
            // 직전 값을 그대로 유지한다. DB도 같은 방식으로 마지막 값을 남긴다.
            heartRate: payload.heart_rate ?? base.heartRate,
            respiration: payload.resp_rate ?? base.respiration,
            present: payload.presence,
          }
        })
      },
      onConnectionChange: setRealtime,
    })
  }, [patientId])

  // 응급 화면은 "지금" 상태를 봐야 하므로, 실시간 값이 있으면 그걸로 덮어쓴다.
  // (덮어쓰지 않으면 응급이 발생한 순간의 과거 기록이 그대로 멈춰 보인다)
  const emergencyEvent = liveVitals
    ? {
        ...data.emergencyEvent,
        heartRate: liveVitals.heartRate,
        respiration: liveVitals.respiration,
        heartAbnormal: isAbnormal(liveVitals.heartRate, HR_NORMAL),
        respAbnormal: isAbnormal(liveVitals.respiration, RR_NORMAL),
        heartStatus: heartRateLevel(liveVitals.heartRate),
        respStatus: respirationLevel(liveVitals.respiration),
      }
    : data.emergencyEvent

  return {
    ...data,
    realtime,
    vitals: liveVitals ?? data.vitals,
    emergencyEvent,
  }
}

/** 요약 문구에서 "그날 가장 나빴던 상태"를 고르기 위한 심각도 순위. 클수록 나쁘다. */
const LEVEL_RANK: Record<VitalLevel, number> = {
  "기록 없음": -1,
  정상: 0,
  낮음: 1,
  높음: 1,
  "매우 낮음": 2,
  "매우 높음": 2,
}

export type DailyVitals = {
  loading: boolean
  /** 하루 중 기록이 한 건이라도 있었는지 */
  hasData: boolean
  /** 00~23시 24칸. 기록이 없는 시간은 value 가 null 이라 선이 끊겨 그려진다. */
  heartRate: HourlyPoint[]
  respiration: HourlyPoint[]
  /** 그날 전체 평균. 기록이 없으면 null */
  heartRateAvg: number | null
  respirationAvg: number | null
  /** 그날 기록 중 가장 나빴던 등급 (요약 문구에 쓴다) */
  worstHeartLevel: VitalLevel
  worstRespLevel: VitalLevel
}

const EMPTY_DAY: DailyVitals = {
  loading: true,
  hasData: false,
  heartRate: toHourlySeries([]),
  respiration: toHourlySeries([]),
  heartRateAvg: null,
  respirationAvg: null,
  worstHeartLevel: "기록 없음",
  worstRespLevel: "기록 없음",
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

/** 1분 평균들 중 가장 나빴던 등급. 시간당 평균으로 재면 짧은 이상이 묻힌다. */
function worstLevel(values: number[], classify: (v: number) => VitalLevel): VitalLevel {
  let worst: VitalLevel = "기록 없음"
  for (const value of values) {
    const level = classify(value)
    if (LEVEL_RANK[level] > LEVEL_RANK[worst]) worst = level
  }
  return worst
}

/**
 * 기록 화면 전용. 캘린더에서 고른 하루치 생체 로그만 서버에서 받아 온다.
 *
 * useGuardianData 와 나눠 둔 이유: 그 훅은 알림·응급기록까지 통째로 다시 불러오는데,
 * 날짜만 바꿔 볼 때 그것들까지 다시 받을 필요가 없다. 여기서는 vital-logs 만 부른다.
 */
export function useDailyVitals(patientId: number | null, day: Date): DailyVitals {
  const [state, setState] = useState<DailyVitals>(EMPTY_DAY)
  // Date 객체는 매 렌더마다 새로 만들어져 그대로 의존성에 넣으면 무한히 다시 부른다.
  // 날짜 문자열로 바꿔서 "같은 날이면 다시 부르지 않게" 한다.
  const dateParam = toDateParam(day)

  useEffect(() => {
    if (patientId == null) return
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    apiClient
      .get(`/patients/${patientId}/vital-logs`, { params: { date: dateParam } })
      .then(({ data }) => {
        if (cancelled) return
        const logs = data.vital_logs as {
          avg_heart_rate: number
          avg_resp_rate: number
          recorded_at: string
        }[]

        const heartValues = logs.map((v) => v.avg_heart_rate)
        const respValues = logs.map((v) => v.avg_resp_rate)

        setState({
          loading: false,
          hasData: logs.length > 0,
          heartRate: toHourlySeries(
            logs.map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_heart_rate })),
          ),
          respiration: toHourlySeries(
            logs.map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_resp_rate })),
          ),
          heartRateAvg: average(heartValues),
          respirationAvg: average(respValues),
          worstHeartLevel: worstLevel(heartValues, heartRateLevel),
          worstRespLevel: worstLevel(respValues, respirationLevel),
        })
      })
      .catch(() => {
        // 서버가 안 붙었거나 권한이 없으면 "기록 없음"으로 둔다.
        // 지어낸 값을 보여주면 보호자가 없는 기록을 있는 것으로 오해한다.
        if (!cancelled) setState({ ...EMPTY_DAY, loading: false })
      })

    return () => {
      cancelled = true
    }
  }, [patientId, dateParam])

  return state
}
