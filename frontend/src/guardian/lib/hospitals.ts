// 대전 지역 요양병원 (데모 데이터)
// code: 병원에서 보호자에게 안내하는 병원 코드
// x, y: 지도 마커 배치용 상대 좌표(%)
export type HospitalInfo = {
  code: string
  name: string
  address: string
  phone: string
  x: number
  y: number
}

export const hospitalDirectory: HospitalInfo[] = [
  { code: "DJ1001", name: "대전요양병원", address: "대전 중구 문화로 282", phone: "042-220-1001", x: 46, y: 58 },
  { code: "DJ1002", name: "한밭실버요양병원", address: "대전 서구 둔산로 100", phone: "042-530-1002", x: 34, y: 48 },
  { code: "DJ1003", name: "유성온천요양병원", address: "대전 유성구 온천북로 55", phone: "042-610-1003", x: 24, y: 34 },
  { code: "DJ1004", name: "대덕행복요양병원", address: "대전 대덕구 계족로 210", phone: "042-930-1004", x: 62, y: 30 },
  { code: "DJ1005", name: "동구사랑요양병원", address: "대전 동구 동서대로 1720", phone: "042-250-1005", x: 70, y: 62 },
]

export function findHospitalByCode(code: string) {
  const key = code.trim().toUpperCase()
  return hospitalDirectory.find((h) => h.code === key) ?? null
}

/** 병원명으로 찾기. 서버가 내려주는 patient.hospital(병원 이름)과 연결하는 용도. */
export function findHospitalByName(name: string) {
  const key = name.trim()
  if (!key || key === "-") return null
  return hospitalDirectory.find((h) => h.name === key) ?? null
}

const INVITE_KEY = "37.5-guardian-invite-code"

/**
 * 초대 링크(...?code=DJ1003)로 들어온 병원 코드를 저장한다.
 * 회원가입은 여러 화면을 거치는데 그 사이 주소창의 ?code= 는 사라지므로,
 * 앱에 처음 들어온 순간 한 번 저장해 두고 환자 정보 화면에서 꺼내 쓴다.
 * (앱 설치 후 새로 열어도 남아 있어야 해서 sessionStorage 가 아닌 localStorage 사용)
 */
export function captureInviteCode(search: string) {
  const code = new URLSearchParams(search).get("code")
  if (!code) return
  try {
    localStorage.setItem(INVITE_KEY, code.trim().toUpperCase())
  } catch {
    // 저장이 막힌 환경에서는 무시 (수동 입력으로 진행)
  }
}

/** 초대 링크로 받은 병원 코드. 링크 없이 들어왔으면 null. */
export function getInviteCode(): string | null {
  try {
    return localStorage.getItem(INVITE_KEY)
  } catch {
    return null
  }
}

const STORAGE_KEY = "37.5-guardian-hospital"

/**
 * 회원가입(환자 정보 확인) 단계에서 등록한 병원 코드를 저장한다.
 * 홈 화면의 "병원 연락" 버튼이 이 병원 번호로 전화를 걸기 위해 필요.
 */
export function saveRegisteredHospital(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code.trim().toUpperCase())
  } catch {
    // 사파리 시크릿 모드 등 저장이 막힌 환경에서는 그냥 넘어간다
  }
}

/** 저장해 둔 병원 정보를 복원한다. 없으면 null. */
export function loadRegisteredHospital(): HospitalInfo | null {
  try {
    const code = localStorage.getItem(STORAGE_KEY)
    return code ? findHospitalByCode(code) : null
  } catch {
    return null
  }
}

/** 전화 앱으로 넘길 링크. 하이픈을 빼야 기기에서 안정적으로 인식된다. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`
}
