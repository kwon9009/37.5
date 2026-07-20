// =============================================================
// 37.5°C 데이터베이스 스키마 (ERD 기반 타입 정의)
// 실제 DB는 아직 연결하지 않음. 향후 Postgres/Neon 등으로 교체 시
// 이 타입을 그대로 재사용하면 됩니다.
// =============================================================

// 공통 타입
export type ID = number // BIGINT
export type Timestamp = string // ISO 8601 문자열 (TIMESTAMP)
export type DateStr = string // "YYYY-MM-DD" (DATE)

// ENUM 정의
export type Gender = "male" | "female" | "other"
export type PatientStatus = "admitted" | "discharged" | "transferred"
export type DeviceStatus = "active" | "inactive" | "error"
export type VitalStatus = "normal" | "warning" | "critical"

// -------------------------------------------------------------
// hospitals
// -------------------------------------------------------------
export interface Hospital {
  hospital_id: ID
  name: string // VARCHAR(50)
  area: string // VARCHAR(20)
}

// -------------------------------------------------------------
// departments (병원 부서 / 의료진 로그인 계정)
// -------------------------------------------------------------
export interface Department {
  department_id: ID
  hospital_id: ID
  login_id: string // VARCHAR(50)
  password: string // VARCHAR(50)
  name: string // VARCHAR(20)
  created_at: Timestamp
  updated_at: Timestamp
}

// -------------------------------------------------------------
// patients
// -------------------------------------------------------------
export interface Patient {
  patient_id: ID
  department_id: ID
  patient_no: string // VARCHAR(20)
  name: string // VARCHAR(20)
  birthdate: DateStr
  gender: Gender
  ward: string // VARCHAR(20)
  room_num: number // INT
  bed_num: number // INT
  special_notes: string // VARCHAR(300)
  status: PatientStatus
  admission_date: DateStr
  discharge_date: DateStr | null
  created_at: Timestamp
  updated_at: Timestamp
}

// -------------------------------------------------------------
// guardians (보호자 로그인 계정)
// -------------------------------------------------------------
export interface Guardian {
  guardian_id: ID
  login_id: string // VARCHAR(50)
  password: string // VARCHAR(50)
  name: string // VARCHAR(20)
  phone: string // VARCHAR(10)
  created_at: Timestamp
  updated_at: Timestamp
}

// -------------------------------------------------------------
// relationships (환자 - 보호자 관계)
// -------------------------------------------------------------
export interface Relationship {
  relationship_id: ID
  patient_id: ID
  guardian_id: ID
  relationship: string // VARCHAR(20) 예: "자녀", "배우자"
}

// -------------------------------------------------------------
// alerts (알림)
// -------------------------------------------------------------
export interface Alert {
  alert_id: ID
  patient_id: ID
  department_id: ID | null
  guardian_id: ID | null
  message: string // VARCHAR(100)
  is_read: boolean
  sent_at: Timestamp
}

// -------------------------------------------------------------
// devices (환자별 모니터링 기기)
// -------------------------------------------------------------
export interface Device {
  device_id: ID
  patient_id: ID
  status: DeviceStatus
  serial_num: string // VARCHAR(20)
  created_at: Timestamp
  updated_at: Timestamp
}

// -------------------------------------------------------------
// vital_checks (실시간 생체신호 측정)
// -------------------------------------------------------------
export interface VitalCheck {
  vital_check_id: ID
  patient_id: ID
  heart_rate: number // INT
  resp_rate: number // INT
  status: VitalStatus
  created_at: Timestamp
  updated_at: Timestamp
}

// -------------------------------------------------------------
// vital_logs (생체신호 집계 로그)
// -------------------------------------------------------------
export interface VitalLog {
  vital_log_id: ID
  patient_id: ID
  avg_heart_rate: number // INT
  avg_resp_rate: number // INT
  recorded_at: Timestamp
}

// -------------------------------------------------------------
// emergency_logs (응급 이벤트 로그)
// -------------------------------------------------------------
export interface EmergencyLog {
  emergency_log_id: ID
  patient_id: ID
  heart_rate: number // INT
  resp_rate: number // INT
  event_type: string // VARCHAR(50) 예: "fall", "resp_abnormal"
  created_at: Timestamp
}

// 전체 DB 형태 (mock in-memory 표현)
export interface Database {
  hospitals: Hospital[]
  departments: Department[]
  patients: Patient[]
  guardians: Guardian[]
  relationships: Relationship[]
  alerts: Alert[]
  devices: Device[]
  vital_checks: VitalCheck[]
  vital_logs: VitalLog[]
  emergency_logs: EmergencyLog[]
}
