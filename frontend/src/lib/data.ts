export const patient = {
  name: "김순자",
  guardian: "김민준",
  relation: "자녀",
  hospital: "서울요양병원",
  room: "302호",
}

export const vitals = {
  heartRate: 78,
  respiration: 16,
  present: true,
}

export type NotiType = "urgent" | "normal"
export type Noti = {
  id: number
  type: NotiType
  title: string
  time: string
}

export const notifications: Noti[] = [
  { id: 1, type: "urgent", title: "낙상이 감지되었습니다. 즉시 확인해 주세요.", time: "방금 전" },
  { id: 2, type: "normal", title: "호흡수가 안정 범위로 돌아왔습니다.", time: "12분 전" },
  { id: 3, type: "normal", title: "심박수가 정상 범위입니다.", time: "1시간 전" },
  { id: 4, type: "normal", title: "재실이 감지되었습니다.", time: "3시간 전" },
]

export const specialNote =
  "지난 밤 수면 중 뒤척임이 평소보다 잦았습니다. 새벽 3시경 잠시 자리를 비운 기록이 있으며, 현재는 안정된 상태로 재실 중입니다."

// Heart-rate style graph data for the records screen
export const heartRateSeries = [
  { t: "00", value: 72 },
  { t: "03", value: 68 },
  { t: "06", value: 70 },
  { t: "09", value: 82 },
  { t: "12", value: 88 },
  { t: "15", value: 84 },
  { t: "18", value: 79 },
  { t: "21", value: 76 },
]

export const respirationSeries = [
  { t: "00", value: 14 },
  { t: "03", value: 13 },
  { t: "06", value: 15 },
  { t: "09", value: 17 },
  { t: "12", value: 18 },
  { t: "15", value: 16 },
  { t: "18", value: 16 },
  { t: "21", value: 15 },
]

export const historyLog = [
  { id: 1, type: "urgent" as NotiType, title: "낙상 감지 · 대응 완료", date: "07.14 02:41" },
  { id: 2, type: "normal" as NotiType, title: "호흡수 이상 감지", date: "07.13 21:10" },
  { id: 3, type: "normal" as NotiType, title: "재실 이탈 감지", date: "07.13 15:22" },
  { id: 4, type: "normal" as NotiType, title: "심박수 정상 회복", date: "07.12 09:05" },
]

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
