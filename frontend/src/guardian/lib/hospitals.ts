import { apiClient } from "@/api/client.js"

/**
 * 병원 정보.
 * phone 은 서버(hospitals.phone)에서 내려온다. 아직 번호를 못 구한 병원이
 * 있어서 optional 이고, 없으면 "병원 연락하기" 버튼이 비활성된다.
 */
export type HospitalInfo = {
  code: string
  name: string
  address: string
  /** 번호를 못 구한 병원은 없을 수 있음 → "병원 연락하기" 버튼이 비활성됨 */
  phone?: string
}

/**
 * ── 개발용 임시 목록 ──────────────────────────────────────────────
 * 서버에 연결하지 못했을 때만 쓰이는 폴백이다.
 * 실제 DB 에는 병원이 62개 있고 코드 형식은 DJ001(3자리)이다.
 * DJ001·DJ002 는 실제 DB 와 이름을 맞춰 두었고, 나머지는 개발 테스트용이다.
 *
 * 전화번호는 일부러 넣지 않는다. 지어낸 번호를 넣어 두면 서버가 안 붙은
 * 상태에서 "병원 연락하기"가 멀쩡히 활성화되고, 보호자가 엉뚱한 곳으로
 * 전화를 걸게 된다. 번호가 없으면 버튼이 비활성으로 표시되어 안전하다.
 * ────────────────────────────────────────────────────────────── */
export const hospitalDirectory: HospitalInfo[] = [
  { code: "DJ001", name: "둔산엔젤요양병원", address: "대전 서구 둔산로 100" },
  { code: "DJ002", name: "중부요양병원", address: "대전 중구 문화로 282" },
  { code: "DJ003", name: "유성온천요양병원", address: "대전 유성구 온천북로 55" },
  { code: "DJ004", name: "대덕행복요양병원", address: "대전 대덕구 계족로 210" },
  { code: "DJ005", name: "동구사랑요양병원", address: "대전 동구 동서대로 1720" },
]

/** 개발용 목록에서 코드로 찾기 (서버 조회 실패 시 폴백) */
function findLocalByCode(code: string): HospitalInfo | null {
  const key = code.trim().toUpperCase()
  return hospitalDirectory.find((h) => h.code === key) ?? null
}

/** 개발용 목록에서 이름으로 찾기 (서버가 병원 이름만 줄 때 폴백) */
export function findHospitalByName(name: string): HospitalInfo | null {
  const key = name.trim()
  if (!key || key === "-") return null
  return hospitalDirectory.find((h) => h.name === key) ?? null
}

/**
 * 병원 코드로 병원 정보를 가져온다. 서버를 먼저 보고, 실패하면 개발용 목록으로 대체한다.
 *
 * 서버의 GET /hospitals/by-code/{code} 는 전화번호까지 함께 준다.
 * 아직 번호를 못 구한 병원은 phone 이 없이 오고, 그때 "병원 연락하기"
 * 버튼은 비활성으로 표시된다.
 */
export async function fetchHospitalByCode(code: string): Promise<HospitalInfo | null> {
  const key = code.trim().toUpperCase()
  if (!key) return null

  try {
    const { data } = await apiClient.get(`/hospitals/by-code/${encodeURIComponent(key)}`)
    if (!data) return findLocalByCode(key)
    return {
      code: data.hospital_code ?? key,
      name: data.name,
      address: data.address,
      phone: data.phone ?? undefined,
    }
  } catch {
    // 서버 미연결 / 엔드포인트 미구현 / 404 → 개발용 목록으로 대체
    return findLocalByCode(key)
  }
}

const INVITE_KEY = "37.5-guardian-invite-code"

/**
 * 초대 링크(...?code=DJ001)로 들어온 병원 코드를 저장한다.
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

/**
 * 초대 링크로 받은 병원 코드. 링크 없이 들어왔으면 null.
 *
 * 주소창의 ?code= 를 먼저 본다. captureInviteCode 는 화면이 그려진 뒤(useEffect)에
 * 저장되므로, 저장값만 보면 이전에 들어온 옛날 코드를 읽어버린다.
 */
export function getInviteCode(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("code")
    if (fromUrl) return fromUrl.trim().toUpperCase()
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

/** 등록해 둔 병원 코드. 없으면 null. */
export function getRegisteredHospitalCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** 전화 앱으로 넘길 링크. 하이픈을 빼야 기기에서 안정적으로 인식된다. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`
}
