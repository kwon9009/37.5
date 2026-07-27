// =============================================================
// 37.5°C API 서비스 계층 (백엔드 시뮬레이션)
// 현재는 in-memory mock-db 에서 데이터를 읽어옵니다.
// 향후 실제 백엔드 연결 시, 이 파일 내부만 fetch()/SQL 로 교체하면
// 화면(호출부) 코드는 그대로 유지됩니다.
//
// 예) 실제 연결 시:
//   export async function getPatient(id: ID): Promise<Patient | null> {
//     const res = await fetch(`/api/patients/${id}`)
//     return res.ok ? res.json() : null
//   }
// =============================================================
import { db } from "./mock-db"
import type {
  ID,
  Patient,
  Guardian,
  Hospital,
  Department,
  Relationship,
  Alert,
  Device,
  VitalCheck,
  VitalLog,
  EmergencyLog,
} from "./schema"

// 네트워크 지연을 흉내내어 실제 API 호출과 동일한 async 흐름 유지
const NETWORK_DELAY_MS = 150
function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), NETWORK_DELAY_MS))
}

// -------------------- patients --------------------
export async function getPatient(patientId: ID): Promise<Patient | null> {
  return simulate(db.patients.find((p) => p.patient_id === patientId) ?? null)
}

export async function listPatients(): Promise<Patient[]> {
  return simulate(db.patients)
}

// -------------------- guardians / relationships --------------------
export async function getGuardian(guardianId: ID): Promise<Guardian | null> {
  return simulate(db.guardians.find((g) => g.guardian_id === guardianId) ?? null)
}

export async function getRelationshipForPatient(patientId: ID): Promise<Relationship | null> {
  return simulate(db.relationships.find((r) => r.patient_id === patientId) ?? null)
}

// -------------------- hospitals / departments --------------------
export async function getHospital(hospitalId: ID): Promise<Hospital | null> {
  return simulate(db.hospitals.find((h) => h.hospital_id === hospitalId) ?? null)
}

export async function getDepartment(departmentId: ID): Promise<Department | null> {
  return simulate(db.departments.find((d) => d.department_id === departmentId) ?? null)
}

export async function getHospitalForPatient(patientId: ID): Promise<Hospital | null> {
  const patient = db.patients.find((p) => p.patient_id === patientId)
  if (!patient) return simulate(null)
  const dept = db.departments.find((d) => d.department_id === patient.department_id)
  if (!dept) return simulate(null)
  return simulate(db.hospitals.find((h) => h.hospital_id === dept.hospital_id) ?? null)
}

// -------------------- alerts --------------------
export async function listAlerts(patientId: ID): Promise<Alert[]> {
  const rows = db.alerts
    .filter((a) => a.patient_id === patientId)
    .sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1))
  return simulate(rows)
}

export async function countUnreadAlerts(patientId: ID): Promise<number> {
  return simulate(db.alerts.filter((a) => a.patient_id === patientId && !a.is_read).length)
}

export async function markAlertRead(alertId: ID): Promise<void> {
  const alert = db.alerts.find((a) => a.alert_id === alertId)
  if (alert) alert.is_read = true
  return simulate(undefined)
}

export async function markAllAlertsRead(patientId: ID): Promise<void> {
  db.alerts.filter((a) => a.patient_id === patientId).forEach((a) => (a.is_read = true))
  return simulate(undefined)
}

// -------------------- devices --------------------
export async function getDeviceForPatient(patientId: ID): Promise<Device | null> {
  return simulate(db.devices.find((d) => d.patient_id === patientId) ?? null)
}

// -------------------- vitals --------------------
export async function getLatestVitalCheck(patientId: ID): Promise<VitalCheck | null> {
  const rows = db.vital_checks
    .filter((v) => v.patient_id === patientId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return simulate(rows[0] ?? null)
}

export async function listVitalLogs(patientId: ID): Promise<VitalLog[]> {
  const rows = db.vital_logs
    .filter((v) => v.patient_id === patientId)
    .sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : 1))
  return simulate(rows)
}

// -------------------- emergency logs --------------------
export async function listEmergencyLogs(patientId: ID): Promise<EmergencyLog[]> {
  const rows = db.emergency_logs
    .filter((e) => e.patient_id === patientId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return simulate(rows)
}
