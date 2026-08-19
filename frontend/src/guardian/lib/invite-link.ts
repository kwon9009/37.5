/**
 * 초대 링크 만들기 / 읽기.
 *
 * 병원이 보호자에게 문자로 보내는 링크다. 예전에는 주소에 병원 코드가
 * 그대로 보였다(`/guardian?code=DJ001`). 코드가 눈에 보이면
 *  - 아무나 숫자만 바꿔 다른 병원 코드를 넣어볼 수 있고,
 *  - 문자를 넘겨받은 사람도 어느 병원인지 바로 알게 된다.
 * 그래서 코드를 되돌릴 수 있게(복호화 가능하게) 섞어서 넣는다.
 *
 *   /guardian/invite?k=AXQ8k9Zr    ← 앱이 열릴 때 풀어서 DJ001 로 되돌린다
 *
 * ⚠️ 한계: 푸는 열쇠가 앱(브라우저) 안에 들어 있으므로, 마음먹고 뜯어보면
 *    풀 수 있다. "주소만 보고는 알 수 없게" 가리는 용도이지 비밀번호가 아니다.
 *    (병원 코드 자체는 병원명·주소 정도만 알려주는 값이고, 실제 환자 정보는
 *     병원이 연동을 승인해야 볼 수 있다.)
 *    진짜 비밀이 필요해지면 서버가 1회용 토큰을 발급하도록 바꿔야 한다.
 */

/** 토큰 형식이 바뀌면 올린다. 옛 링크를 계속 열어줄지 판단하는 데 쓴다. */
const VERSION = 1

/** 섞는 데 쓰는 열쇠. 비밀정보가 아니므로 .env 로 뺄 필요는 없다. */
const SECRET = "37.5-guardian-invite"

/** 병원 코드 형식(DJ001 처럼 영문+숫자). 풀어낸 값이 이 꼴이어야 성공으로 본다. */
const CODE_PATTERN = /^[A-Z0-9]{3,10}$/

/** 링크에 실리는 토큰 파라미터 이름 */
export const INVITE_PARAM = "k"

/** 예전 링크(`?code=DJ001`)에서 쓰던 파라미터 이름. 당분간 같이 받아준다. */
export const LEGACY_INVITE_PARAM = "code"

/**
 * 열쇠와 소금(salt)으로 바이트 열을 만든다.
 * 같은 병원 코드라도 소금이 달라지면 링크 모양이 매번 달라진다.
 */
function keystream(salt: number, length: number): number[] {
  // FNV-1a 로 열쇠+소금을 32비트 씨앗 하나로 압축
  let seed = 0x811c9dc5
  for (let i = 0; i < SECRET.length; i++) {
    seed = Math.imul(seed ^ SECRET.charCodeAt(i), 0x01000193) >>> 0
  }
  seed = Math.imul(seed ^ salt, 0x01000193) >>> 0

  // xorshift32 로 씨앗을 필요한 길이만큼 늘린다
  let x = seed || 0x9e3779b9
  const out: number[] = []
  for (let i = 0; i < length; i++) {
    x ^= (x << 13) >>> 0
    x >>>= 0
    x ^= x >>> 17
    x ^= (x << 5) >>> 0
    x >>>= 0
    out.push(x & 0xff)
  }
  return out
}

/** 잘못 눌러 한 글자가 빠진 링크를 "성공"으로 착각하지 않도록 두는 검사값 */
function checksum(bytes: number[]): number {
  let h = 0x811c9dc5
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0
  return h & 0xff
}

/** 주소에 그대로 쓸 수 있는 base64 (+ / = 를 안 쓰는 형태) */
function toBase64Url(bytes: number[]): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): number[] | null {
  try {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
    return Array.from(binary, (ch) => ch.charCodeAt(0))
  } catch {
    return null
  }
}

/**
 * 병원 코드를 링크에 넣을 토큰으로 바꾼다.
 * 같은 코드라도 부를 때마다 다른 문자열이 나온다(소금이 무작위라서).
 */
export function encodeInviteCode(code: string): string {
  const clean = code.trim().toUpperCase()
  if (!CODE_PATTERN.test(clean)) {
    throw new Error("병원 코드 형식이 올바르지 않습니다. (예: DJ001)")
  }

  const plain = Array.from(clean, (ch) => ch.charCodeAt(0))
  const salt = Math.floor(Math.random() * 256)
  const key = keystream(salt, plain.length)
  const cipher = plain.map((b, i) => b ^ key[i])

  return toBase64Url([VERSION, salt, checksum(plain), ...cipher])
}

/** 토큰을 병원 코드로 되돌린다. 못 풀면 null (수동 입력으로 진행하면 된다). */
export function decodeInviteToken(token: string): string | null {
  const bytes = fromBase64Url(token.trim())
  if (!bytes || bytes.length < 4) return null

  const [version, salt, check, ...cipher] = bytes
  if (version !== VERSION) return null

  const key = keystream(salt, cipher.length)
  const plain = cipher.map((b, i) => b ^ key[i])
  if (checksum(plain) !== check) return null

  const code = String.fromCharCode(...plain)
  return CODE_PATTERN.test(code) ? code : null
}

/**
 * 주소(?k=... 또는 예전 ?code=...)에서 병원 코드를 꺼낸다.
 * 링크가 아니거나 풀리지 않으면 null.
 */
export function readInviteCode(search: string): string | null {
  const params = new URLSearchParams(search)

  const token = params.get(INVITE_PARAM)
  if (token) {
    const decoded = decodeInviteToken(token)
    if (decoded) return decoded
  }

  // 예전에 나간 링크·개발 중 직접 입력한 주소는 계속 열어준다
  const legacy = params.get(LEGACY_INVITE_PARAM)?.trim().toUpperCase()
  if (legacy && CODE_PATTERN.test(legacy)) return legacy

  return null
}

/**
 * 문자로 보낼 초대 링크 전체 주소.
 * origin 을 넘기지 않으면 지금 보고 있는 주소를 기준으로 만든다.
 */
export function buildInviteUrl(code: string, origin?: string): string {
  const base = (origin ?? window.location.origin).replace(/\/+$/, "")
  return `${base}/guardian/invite?${INVITE_PARAM}=${encodeInviteCode(code)}`
}
