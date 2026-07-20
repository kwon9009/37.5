// =============================================================
// 화면용 View-Model (mock-db 파생)
// 화면들이 기존처럼 동기적으로 쓰던 값들을 ERD 기반 mock-db 에서
// 파생시켜 단일 출처(single source of truth)를 유지합니다.
// 실제 백엔드 연결 시에는 각 화면에서 src/lib/api.ts 의 async
// 함수를 호출하도록 점진적으로 교체하면 됩니다.
// =============================================================
import { db } from "./mock-db"
import type { NotiType } from "./schema-view"

const currentPatient = db.patients[0]
const rel = db.relationships.find((r) => r.patient_id === currentPatient.patient_id)
const guardian = db.guardians.find((g) => g.guardian_id === rel?.guardian_id)
const dept = db.departments.find((d) => d.department_id === currentPatient.department_id)
const hospital = db.hospitals.find((h) => h.hospital_id === dept?.hospital_id)
const latestVital = db.vital_checks.find((v) => v.patient_id === currentPatient.patient_id)
const device = db.devices.find((d) => d.patient_id === currentPatient.patient_id)

export const patient = {
  name: currentPatient.name,
  guardian: guardian?.name ?? "-",
  relation: rel?.relationship ?? "-",
  hospital: hospital?.name ?? "-",
  room: `${currentPatient.room_num}호`,
}

export const vitals = {
  heartRate: latestVital?.heart_rate ?? 0,
  respiration: latestVital?.resp_rate ?? 0,
  present: device?.status === "active",
}

export type { NotiType }
export type Noti = {
  id: number
  type: NotiType
  title: string
  time: string
}

// 상대 시간 표기 (mock: sent_at → "방금 전" 형태 근사)
function relativeTime(sentAt: string): string {
  const diffMs = Date.now() - new Date(sentAt).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "방금 전"
  if (min < 60) return `${min}분 전`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.round(hr / 24)}일 전`
}

export const notifications: Noti[] = db.alerts
  .filter((a) => a.patient_id === currentPatient.patient_id)
  .sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1))
  .map((a) => ({
    id: a.alert_id,
    type: (a.is_read ? "normal" : "urgent") as NotiType,
    title: a.message,
    time: relativeTime(a.sent_at),
  }))

export const specialNote = currentPatient.special_notes

// 생체신호 집계 로그 → 그래프 시리즈
function hourLabel(iso: string): string {
  return new Date(iso).toISOString().slice(11, 13)
}

export const heartRateSeries = db.vital_logs
  .filter((v) => v.patient_id === currentPatient.patient_id)
  .sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : 1))
  .map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_heart_rate }))

export const respirationSeries = db.vital_logs
  .filter((v) => v.patient_id === currentPatient.patient_id)
  .sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : 1))
  .map((v) => ({ t: hourLabel(v.recorded_at), value: v.avg_resp_rate }))

// 알림 + 응급 이력
function shortDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${mm}.${dd} ${hh}:${mi}`
}

export const historyLog = [
  ...db.emergency_logs
    .filter((e) => e.patient_id === currentPatient.patient_id)
    .map((e) => ({
      id: 10000 + e.emergency_log_id,
      type: "urgent" as NotiType,
      title: `응급 이벤트 (${e.event_type}) · 심박 ${e.heart_rate} / 호흡 ${e.resp_rate}`,
      date: shortDate(e.created_at),
    })),
  ...db.alerts
    .filter((a) => a.patient_id === currentPatient.patient_id)
    .map((a) => ({
      id: a.alert_id,
      type: (a.is_read ? "normal" : "urgent") as NotiType,
      title: a.message,
      date: shortDate(a.sent_at),
    })),
].sort((a, b) => (a.date < b.date ? 1 : -1))

export const faqs = [
  {
    q: "생체신호는 얼마나 자주 갱신되나요?",
    a: "심박수와 호흡수는 실시간으로 측정되어 약 5초 간격으로 앱에 반영됩니다.",
  },
  {
    q: "긴급 알림은 어떻게 동작하나요?",
    a: "낙상 등 응급 상황이 감지되면 즉시 푸시 알림과 함께 응급 대응 가이드 화면이 표시됩니다.",
  },
  {
    q: "병원 연락 버튼을 누르면 어떻게 되나요?",
    a: "환자가 입원한 병원의 담당 부서로 바로 전화 연결이 진행됩니다.",
  },
  {
    q: "재실 유무는 어떤 의미인가요?",
    a: "환자가 병실 침대 및 지정 구역 내에 있는지를 센서로 감지한 결과입니다.",
  },
]
