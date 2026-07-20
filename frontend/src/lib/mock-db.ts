// =============================================================
// 37.5°C In-memory Mock Database (ERD 시드 데이터)
// 실제 DB 미연결 상태. 향후 Postgres/Neon 연결 시 이 파일을
// 실제 쿼리로 교체하고, api.ts의 함수 시그니처는 그대로 유지.
// =============================================================
import type { Database } from "./schema"

export const db: Database = {
  hospitals: [
    { hospital_id: 1, name: "서울열림병원", area: "서울 강남구" },
    { hospital_id: 2, name: "한빛요양병원", area: "경기 성남시" },
  ],

  departments: [
    {
      department_id: 1,
      hospital_id: 1,
      login_id: "ward3f",
      password: "hashed_pw_dept",
      name: "3층 병동 간호팀",
      created_at: "2026-01-02T09:00:00Z",
      updated_at: "2026-07-01T09:00:00Z",
    },
  ],

  patients: [
    {
      patient_id: 1,
      department_id: 1,
      patient_no: "P-2026-0417",
      name: "김순자",
      birthdate: "1946-03-11",
      gender: "female",
      ward: "3층 A병동",
      room_num: 305,
      bed_num: 2,
      special_notes: "고혈압 약 복용 중. 낙상 주의. 야간 화장실 이동 시 보조 필요.",
      status: "admitted",
      admission_date: "2026-06-28",
      discharge_date: null,
      created_at: "2026-06-28T10:30:00Z",
      updated_at: "2026-07-14T08:00:00Z",
    },
  ],

  guardians: [
    {
      guardian_id: 1,
      login_id: "family_kim",
      password: "hashed_pw_guardian",
      name: "김민재",
      phone: "01012345678",
      created_at: "2026-06-28T11:00:00Z",
      updated_at: "2026-07-10T11:00:00Z",
    },
  ],

  relationships: [
    { relationship_id: 1, patient_id: 1, guardian_id: 1, relationship: "자녀" },
  ],

  alerts: [
    {
      alert_id: 1,
      patient_id: 1,
      department_id: 1,
      guardian_id: 1,
      message: "낙상이 감지되었습니다. 즉시 확인이 필요합니다.",
      is_read: false,
      sent_at: "2026-07-14T14:22:00Z",
    },
    {
      alert_id: 2,
      patient_id: 1,
      department_id: 1,
      guardian_id: 1,
      message: "호흡수가 정상 범위로 회복되었습니다.",
      is_read: true,
      sent_at: "2026-07-14T09:05:00Z",
    },
    {
      alert_id: 3,
      patient_id: 1,
      department_id: null,
      guardian_id: 1,
      message: "오늘 오전 회진이 완료되었습니다.",
      is_read: true,
      sent_at: "2026-07-14T08:40:00Z",
    },
  ],

  devices: [
    {
      device_id: 1,
      patient_id: 1,
      status: "active",
      serial_num: "DVC-37A5-0021",
      created_at: "2026-06-28T10:30:00Z",
      updated_at: "2026-07-14T14:20:00Z",
    },
  ],

  vital_checks: [
    {
      vital_check_id: 1,
      patient_id: 1,
      heart_rate: 78,
      resp_rate: 17,
      status: "normal",
      created_at: "2026-07-14T14:20:00Z",
      updated_at: "2026-07-14T14:20:00Z",
    },
  ],

  // 시간대별 집계 (그래프용)
  vital_logs: [
    { vital_log_id: 1, patient_id: 1, avg_heart_rate: 72, avg_resp_rate: 16, recorded_at: "2026-07-14T06:00:00Z" },
    { vital_log_id: 2, patient_id: 1, avg_heart_rate: 75, avg_resp_rate: 16, recorded_at: "2026-07-14T09:00:00Z" },
    { vital_log_id: 3, patient_id: 1, avg_heart_rate: 80, avg_resp_rate: 18, recorded_at: "2026-07-14T12:00:00Z" },
    { vital_log_id: 4, patient_id: 1, avg_heart_rate: 78, avg_resp_rate: 17, recorded_at: "2026-07-14T15:00:00Z" },
    { vital_log_id: 5, patient_id: 1, avg_heart_rate: 74, avg_resp_rate: 15, recorded_at: "2026-07-14T18:00:00Z" },
    { vital_log_id: 6, patient_id: 1, avg_heart_rate: 71, avg_resp_rate: 15, recorded_at: "2026-07-14T21:00:00Z" },
  ],

  emergency_logs: [
    {
      emergency_log_id: 1,
      patient_id: 1,
      heart_rate: 122,
      resp_rate: 26,
      event_type: "fall",
      created_at: "2026-07-14T14:22:00Z",
    },
  ],
}
