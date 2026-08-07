import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

/**
 * 카카오맵 표시 컴포넌트.
 *
 * 준비물: 카카오 개발자센터(developers.kakao.com)에서 발급한 "JavaScript 키" 를
 *        frontend/.env 에 VITE_KAKAO_MAP_KEY 로 넣어야 한다.
 *        (사이트 도메인 등록도 필요 — 로컬은 http://localhost:5173)
 *
 * 키가 없거나 지도를 못 불러오면 주소만 보여주는 대체 화면이 나온다.
 * 지도가 안 떠도 병원 코드 등록 자체는 문제없이 진행된다.
 */

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined
const SDK_ID = "kakao-maps-sdk"

// 주소 → 좌표 변환이 필요해서 services 라이브러리를 함께 불러온다
function sdkUrl(key: string) {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
}

/** 카카오 지도 스크립트를 한 번만 불러온다 (여러 화면에서 써도 중복 로드 안 됨) */
let loader: Promise<void> | null = null
function loadKakaoSdk(): Promise<void> {
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

/** 카카오 SDK 타입 (필요한 부분만 최소로 선언) */
type LatLng = unknown
type KakaoNamespace = {
  maps: {
    load: (cb: () => void) => void
    LatLng: new (lat: number, lng: number) => LatLng
    Map: new (container: HTMLElement, options: { center: LatLng; level: number }) => unknown
    Marker: new (options: { map: unknown; position: LatLng }) => unknown
    services: {
      Geocoder: new () => {
        addressSearch: (
          address: string,
          cb: (result: Array<{ x: string; y: string }>, status: string) => void,
        ) => void
      }
      Status: { OK: string }
    }
  }
}

type Props = {
  /** 병원 주소. 이 주소를 좌표로 바꿔서 지도에 표시한다 */
  address: string
  /** 지도 위에 표시할 이름 (스크린리더용) */
  name: string
  className?: string
}

export function KakaoMap({ address, name, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setFailed(false)

    loadKakaoSdk()
      .then(() => {
        if (!alive || !boxRef.current) return
        const kakao = (window as unknown as { kakao: KakaoNamespace }).kakao
        const geocoder = new kakao.maps.services.Geocoder()

        geocoder.addressSearch(address, (result, status) => {
          if (!alive || !boxRef.current) return
          if (status !== kakao.maps.services.Status.OK || !result[0]) {
            setFailed(true)
            return
          }
          const center = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x))
          const map = new kakao.maps.Map(boxRef.current, { center, level: 4 })
          new kakao.maps.Marker({ map, position: center })
        })
      })
      .catch(() => {
        if (alive) setFailed(true)
      })

    return () => {
      alive = false
    }
  }, [address])

  // 키가 없거나 주소를 못 찾은 경우: 주소만 보여준다
  if (failed) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-1 bg-muted/40 px-4 text-center">
          <MapPin size={22} className="text-muted-foreground" aria-hidden />
          <p className="text-xs font-medium text-foreground">{address}</p>
          <p className="text-[10px] text-muted-foreground">지도를 불러오지 못했습니다</p>
        </div>
      </div>
    )
  }

  return <div ref={boxRef} className={className} role="img" aria-label={`${name} 위치 지도`} />
}
