import { apiClient } from "@/api/client.js"

/**
 * 병원 정보.
 * 실제 DB(hospitals 테이블)에는 아직 전화번호 컬럼이 없어서 phone 은 optional 이다.
 * 백엔드에 phone 이 추가되면 그대로 채워져 내려온다.
 */
export type HospitalInfo = {
  code: string
  name: string
  address: string
  /** 백엔드에 phone 컬럼 추가 전까지는 없을 수 있음 → "병원 연락" 버튼이 비활성됨 */
  phone?: string
  /** 목업 지도용 상대 좌표(%). 구글맵/카카오맵 연동 시 위경도로 교체 예정 */
  x?: number
  y?: number
}

/**
 * ── 개발용 임시 목록 ──────────────────────────────────────────────
 * 서버가 없거나 조회 API 가 아직 없을 때만 쓰이는 폴백이다.
 * 실제 DB 에는 병원이 63개 있고 코드 형식은 DJ001(3자리)이다.
 * DJ001·DJ002 는 실제 DB 와 이름을 맞춰 두었고, 나머지는 개발 테스트용이다.
 * 전화번호는 DB 에 아직 없어서 여기 값도 전부 임시다.
 * ────────────────────────────────────────────────────────────── */
export const hospitalDirectory: HospitalInfo[] = [
  { code: "DJ001", name: "둔산엔젤요양병원", address: "대전 서구 둔산로 100", phone: "042-000-0001", x: 34, y: 48 },
  { code: "DJ002", name: "중부요양병원", address: "대전 중구 문화로 282", phone: "042-000-0002", x: 46, y: 58 },
  { code: "DJ003", name: "유성온천요양병원", address: "대전 유성구 온천북로 55", phone: "042-000-0003", x: 24, y: 34 },
  { code: "DJ004", name: "대덕행복요양병원", address: "대전 대덕구 계족로 210", phone: "042-000-0004", x: 62, y: 30 },
  { code: "DJ005", name: "동구사랑요양병원", address: "대전 동구 동서대로 1720", phone: "042-000-0005", x: 70, y: 62 },
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
 * TODO(백엔드): GET /hospitals/by-code/{code} 엔드포인트가 아직 없다.
 *   생기면 아래 catch 의 폴백은 그대로 두고 정상 동작한다.
 *   응답에 phone 이 포함되면 "병원 연락" 버튼이 자동으로 살아난다.
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
