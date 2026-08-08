/**
 * 카카오 지도 SDK 로드와 "주소 → 좌표" 변환을 담당한다.
 *
 * 지도를 그리는 화면(KakaoMap)과 63개 병원을 한꺼번에 점검하는 개발용 화면이
 * 똑같은 방법으로 위치를 찾아야 해서, 공통으로 쓰는 부분만 여기에 모았다.
 * (점검 결과와 실제 화면이 다르면 점검하는 의미가 없다.)
 *
 * 준비물: 카카오 개발자센터에서 발급한 "JavaScript 키" 를
 *        frontend/.env 에 VITE_KAKAO_MAP_KEY 로 넣어야 한다.
 *        추가로 카카오 콘솔에서 두 가지가 모두 켜져 있어야 한다.
 *          1) 앱 > 카카오맵 > 활성화 설정 ON
 *          2) 앱 > 플랫폼 키 > JavaScript 키 > JavaScript SDK 도메인에
 *             http://localhost:5173 등록
 */

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined
const SDK_ID = "kakao-maps-sdk"

// 주소 → 좌표 변환이 필요해서 services 라이브러리를 함께 불러온다
function sdkUrl(key: string) {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
}

/** 카카오 지도 스크립트를 한 번만 불러온다 (여러 화면에서 써도 중복 로드 안 됨) */
let loader: Promise<void> | null = null
export function loadKakaoSdk(): Promise<void> {
  if (!KAKAO_KEY) return Promise.reject(new Error("VITE_KAKAO_MAP_KEY 없음"))
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const done = () => {
      const kakao = (window as unknown as { kakao?: KakaoNamespace }).kakao
      if (!kakao) return reject(new Error("kakao 전역 객체 없음"))
      kakao.maps.load(() => resolve())
    }

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", done)
      existing.addEventListener("error", () => reject(new Error("SDK 로드 실패")))
      return
    }

    const script = document.createElement("script")
    script.id = SDK_ID
    script.src = sdkUrl(KAKAO_KEY)
    script.async = true
    script.onload = done
    script.onerror = () => reject(new Error("SDK 로드 실패"))
    document.head.appendChild(script)
  }).catch((e) => {
    loader = null // 다음에 다시 시도할 수 있게
    throw e
  })

  return loader
}

/** 로드가 끝난 뒤 전역에 올라온 카카오 객체를 꺼낸다 */
export function getKakao(): KakaoNamespace {
  return (window as unknown as { kakao: KakaoNamespace }).kakao
}

/** 카카오 SDK 타입 (필요한 부분만 최소로 선언) */
export type LatLng = unknown
export type KakaoMapInstance = {
  setCenter: (position: LatLng) => void
  setLevel: (level: number) => void
  relayout: () => void
}
export type KakaoMarker = {
  setPosition: (position: LatLng) => void
}
/**
 * 카카오 검색 결과 한 건.
 * 주소 검색(Geocoder)은 x·y 만 쓰고, 장소 검색(Places)은 상호명·전화번호까지 준다.
 */
export type SearchResult = {
  x: string
  y: string
  place_name?: string
  road_address_name?: string
  address_name?: string
  phone?: string
}
export type KakaoNamespace = {
  maps: {
    load: (cb: () => void) => void
    LatLng: new (lat: number, lng: number) => LatLng
    Map: new (
      container: HTMLElement,
      options: { center: LatLng; level: number },
    ) => KakaoMapInstance
    Marker: new (options: { map: KakaoMapInstance; position: LatLng }) => KakaoMarker
    services: {
      Geocoder: new () => {
        addressSearch: (
          address: string,
          cb: (result: SearchResult[], status: string) => void,
        ) => void
      }
      Places: new () => {
        keywordSearch: (
          keyword: string,
          cb: (result: SearchResult[], status: string) => void,
        ) => void
      }
      Status: { OK: string }
    }
  }
}

export type Point = { lat: number; lng: number }

/**
 * 카카오 검색이 응답을 아예 주지 않는 경우가 있어(키·도메인 문제 등) 제한 시간을 둔다.
 * 이게 없으면 결과도 실패 안내도 없이 빈 칸만 남는다.
 */
const SEARCH_TIMEOUT_MS = 6000

/**
 * 주소 검색에 넣어볼 후보들을 만든다.
 *
 * DB에 들어 있는 실제 병원 주소는 이런 모양이다.
 *   "대전광역시 서구 대덕대로 244-0 (둔산동,건국타워5층,9~11층)"
 *
 * 카카오 주소검색은 괄호 안의 동·건물명·층수 같은 상세정보가 붙어 있으면
 * 못 찾는 경우가 있다. 그래서 뒤쪽 정보부터 하나씩 덜어내며 다시 시도한다.
 */
export function addressCandidates(address: string): string[] {
  const list: string[] = []
  const add = (value: string) => {
    const trimmed = value.trim().replace(/\s+/g, " ")
    if (trimmed && !list.includes(trimmed)) list.push(trimmed)
  }

  // 1) 원본 그대로
  add(address)

  // 2) 첫 괄호부터 뒤쪽을 통째로 잘라낸다 → "대전광역시 서구 대덕대로 244-0"
  //    "(대사동, 1~5층 (대사동))" 처럼 괄호 안에 괄호가 또 있는 주소도 있어서,
  //    짝을 맞춰 지우는 대신 첫 괄호 앞까지만 남기는 편이 안전하다.
  const base = address.split("(")[0]
  add(base)

  // 3) 건물번호 뒤 "-0" 제거 → "대전광역시 서구 대덕대로 244"
  //    부번이 없는데도 244-0 으로 적어둔 데이터가 많아 그대로는 못 찾는다.
  add(base.replace(/(\d+)-0(?!\d)/, "$1"))

  return list
}

type SearchOutcome = { point: Point | null; status: string }

/** 콜백으로 오는 카카오 검색 결과를 await 로 쓸 수 있게 감싼다 */
function toPoint(
  kakao: KakaoNamespace,
  run: (cb: (result: SearchResult[], status: string) => void) => void,
): Promise<SearchOutcome> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (outcome: SearchOutcome) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(outcome)
    }

    const timer = setTimeout(() => finish({ point: null, status: "무응답" }), SEARCH_TIMEOUT_MS)

    try {
      run((result, status) => {
        if (status !== kakao.maps.services.Status.OK || !result[0]) {
          return finish({ point: null, status: String(status) })
        }
        finish({
          point: { lat: Number(result[0].y), lng: Number(result[0].x) },
          status: "OK",
        })
      })
    } catch (e) {
      finish({ point: null, status: `예외:${(e as Error).message}` })
    }
  })
}

/** 장소 검색으로 받은 실제 등록 정보 */
export type Place = {
  name: string
  /** 도로명주소. 없는 곳도 있어서 그때는 지번주소를 쓴다 */
  roadAddress: string
  jibunAddress: string
  phone: string
  lat: number
  lng: number
}

/**
 * 카카오에 등록된 장소를 이름으로 찾는다.
 *
 * 목업 병원 데이터를 만들 때 쓴다. 여기서 나온 병원은 카카오가 이미 알고 있는
 * 곳이므로, 그 이름·주소를 그대로 쓰면 지도가 반드시 뜬다.
 * (주소를 지어내면 지도에서 못 찾는 일이 생긴다 — 실제로 겪었다.)
 */
export function searchPlaces(kakao: KakaoNamespace, keyword: string): Promise<Place[]> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (places: Place[]) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(places)
    }

    const timer = setTimeout(() => finish([]), SEARCH_TIMEOUT_MS)

    try {
      new kakao.maps.services.Places().keywordSearch(keyword, (result, status) => {
        if (status !== kakao.maps.services.Status.OK) return finish([])
        finish(
          result.map((r) => ({
            name: r.place_name ?? "",
            roadAddress: r.road_address_name ?? "",
            jibunAddress: r.address_name ?? "",
            phone: r.phone ?? "",
            lat: Number(r.y),
            lng: Number(r.x),
          })),
        )
      })
    } catch {
      finish([])
    }
  })
}

export type FindResult = {
  point: Point | null
  /** 어떤 검색이 성공/실패했는지 순서대로 기록. 실패 원인을 눈으로 보기 위한 것 */
  steps: string[]
  /** 성공한 검색 방법 (예: '주소 2단계'). 실패면 null */
  matchedBy: string | null
}

/**
 * 위치를 찾을 때까지 여러 방법을 차례로 시도한다.
 *
 * 카카오에는 성격이 다른 검색이 두 가지 있다.
 *   - 주소 검색(Geocoder)  : 정확하지만 주소 형식에 엄격하다. 조금만 어긋나도 못 찾는다.
 *   - 장소 검색(Places)    : 형식에 관대하다. 상호명도 주소도 받아준다.
 *
 * 그래서 주소 검색으로 먼저 훑고, 실패하면 같은 문자열을 장소 검색으로 다시 넣어본다.
 * 실제로 "대전광역시 서구 도산로 224" 처럼 주소 검색만으로는 안 잡히는 병원이 있다.
 */
export async function findPoint(
  kakao: KakaoNamespace,
  address: string,
  name: string,
): Promise<FindResult> {
  const geocoder = new kakao.maps.services.Geocoder()
  const places = new kakao.maps.services.Places()
  const steps: string[] = []
  const candidates = addressCandidates(address)

  // 1) 주소 검색
  for (const [index, candidate] of candidates.entries()) {
    const { point, status } = await toPoint(kakao, (cb) =>
      geocoder.addressSearch(candidate, cb),
    )
    steps.push(`주소 "${candidate}" → ${status}`)
    if (point) return { point, steps, matchedBy: `주소 ${index + 1}단계` }
  }

  // 2) 장소 검색 — 병원 이름을 먼저, 그다음 정리한 주소를 넣어본다.
  //    괄호가 붙은 원본 주소는 장소 검색에서도 방해가 되므로 제외한다.
  const keywords = [...new Set([name.trim(), ...candidates.slice(1)].filter(Boolean))]
  for (const [index, keyword] of keywords.entries()) {
    const { point, status } = await toPoint(kakao, (cb) =>
      places.keywordSearch(keyword, cb),
    )
    steps.push(`장소 "${keyword}" → ${status}`)
    if (point) {
      return { point, steps, matchedBy: index === 0 ? "장소(병원 이름)" : "장소(주소)" }
    }
  }

  return { point: null, steps, matchedBy: null }
}
