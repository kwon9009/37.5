import { useEffect, useState } from "react"
import { apiClient } from "@/api/client.js"
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

// 센서가 1초마다 값을 보내므로 화면도 주기적으로 다시 불러온다(실시간 표시)
const REFRESH_MS = 5000

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
        const heartAbnormal = evHeart < HR_NORMAL.min || evHeart > HR_NORMAL.max
        const respAbnormal = evResp < RR_NORMAL.min || evResp > RR_NORMAL.max

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

        setData({
          loading: false,
          patient: {
            patientId: myPatient.patient_id,
            name: myPatient.name,
            guardian: me.name,
            relation: myPatient.relation,
            hospital: detail.patient.hospital,
            room: `${myPatient.room_num}호`,
          },
          vitals: {
            heartRate: detail.current_vital?.heart_rate ?? 0,
            respiration: detail.current_vital?.resp_rate ?? 0,
            present: myPatient.is_present,
          },
          emergencyEvent: {
            heartRate: evHeart,
            respiration: evResp,
            eventType: latestEmergency?.event_type ?? "cardiac",
            heartAbnormal,
            respAbnormal,
            heartStatus: evHeart > HR_NORMAL.max ? "높음" : evHeart < HR_NORMAL.min ? "낮음" : "정상",
            respStatus: evResp > RR_NORMAL.max ? "높음" : evResp < RR_NORMAL.min ? "낮음" : "정상",
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
    const timer = setInterval(load, REFRESH_MS)   // 주기적 갱신
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return data
}
