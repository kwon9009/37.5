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

const HR_NORMAL = { min: 60, max: 100 }
const RR_NORMAL = { min: 12, max: 20 }

type Range = { min: number; max: number }

function isAbnormal(value: number, range: Range): boolean {
  return value < range.min || value > range.max
}

function levelLabel(value: number, range: Range): string {
  if (value > range.max) return "높음"
  if (value < range.min) return "낮음"
  return "정상"
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

function hourLabel(iso: string): string {
  return new Date(iso).toISOString().slice(11, 13)
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
          apiClient.get(`/patients/${myPatient.patient_id}/vital-logs`),
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
            heartStatus: levelLabel(evHeart, HR_NORMAL),
            respStatus: levelLabel(evResp, RR_NORMAL),
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
        heartStatus: levelLabel(liveVitals.heartRate, HR_NORMAL),
        respStatus: levelLabel(liveVitals.respiration, RR_NORMAL),
      }
    : data.emergencyEvent

  return {
    ...data,
    realtime,
    vitals: liveVitals ?? data.vitals,
    emergencyEvent,
  }
}
