import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

import {
  findPoint,
  getKakao,
  loadKakaoSdk,
  type KakaoMapInstance,
  type KakaoMarker,
} from "@/guardian/lib/kakao-geocode"

/**
 * 카카오맵 표시 컴포넌트.
 *
 * 키 설정과 "주소 → 좌표" 변환은 guardian/lib/kakao-geocode.ts 가 맡는다.
 * 여기서는 찾은 좌표를 지도에 그리는 일만 한다.
 *
 * 키가 없거나 위치를 못 찾으면 주소만 보여주는 대체 화면이 나온다.
 * 지도가 안 떠도 병원 코드 등록 자체는 문제없이 진행된다.
 */

/**
 * 지도 확대 정도. 숫자가 작을수록 더 확대된다.
 *   2 = 30m   3 = 50m   4 = 100m   5 = 250m
 * 3부터 건물 이름이 보이기 시작해서, 병원 이름을 확인할 수 있는 3으로 둔다.
 */
const MAP_LEVEL = 3

type Props = {
  /** 병원 주소. 이 주소를 좌표로 바꿔서 지도에 표시한다 */
  address: string
  /** 지도 위에 표시할 이름 (주소로 못 찾을 때 이 이름으로 다시 검색한다) */
  name: string
  className?: string
}

export function KakaoMap({ address, name, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMapInstance | null>(null)
  const markerRef = useRef<KakaoMarker | null>(null)
  const [failed, setFailed] = useState(false)
  // 개발 중에만 화면에 보여줄 실패 사유. 콘솔 필터에 가려지지 않게 화면에 직접 띄운다.
  const [detail, setDetail] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    setFailed(false)
    setDetail([])

    loadKakaoSdk()
      .then(async () => {
        if (!alive) return
        const kakao = getKakao()

        const { point, steps } = await findPoint(kakao, address, name)
        if (!alive || !boxRef.current) return
        if (!point) {
          console.warn("[KakaoMap] 위치를 찾지 못했습니다", steps)
          setDetail(steps)
          setFailed(true)
          return
        }

        const center = new kakao.maps.LatLng(point.lat, point.lng)

        // 병원 코드를 다시 입력하면 같은 자리에 지도를 새로 만드는 대신
        // 기존 지도를 그대로 두고 중심만 옮긴다.
        // 확대 정도도 함께 되돌려서, 앞 병원에서 손으로 확대/축소한 상태가 남지 않게 한다.
        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(center)
          mapRef.current.setLevel(MAP_LEVEL)
          markerRef.current.setPosition(center)
          mapRef.current.relayout()
          return
        }

        mapRef.current = new kakao.maps.Map(boxRef.current, { center, level: MAP_LEVEL })
        markerRef.current = new kakao.maps.Marker({ map: mapRef.current, position: center })
      })
      .catch((e: Error) => {
        if (!alive) return
        console.warn("[KakaoMap] 지도 SDK를 불러오지 못했습니다", e)
        setDetail([`SDK 로드 실패: ${e.message}`])
        setFailed(true)
      })

    return () => {
      alive = false
    }
  }, [address, name])

  // 지도 칸은 항상 화면에 두고, 실패했을 때만 그 위에 주소 안내를 덮어씌운다.
  // (실패 화면으로 통째로 바꿔버리면 지도 칸이 사라져서, 다음 병원을 조회할 때
  //  지도를 그릴 자리를 찾지 못해 빈 흰 칸이 남는다.)
  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        ref={boxRef}
        className="h-full w-full"
        role="img"
        aria-label={`${name} 위치 지도`}
      />
      {/*
        z-999 · 불투명 배경이 필요한 이유:
        카카오 지도는 내부 레이어에 z-index 를 직접 지정한다. 안내 화면에 z-index 가
        없으면 지도 타일 "뒤"로 깔려서, 앞 병원의 지도가 그대로 보이고 안내는 안 보인다.
        (다른 병원 위치를 잘못 보여주게 되므로 배경도 반투명이 아닌 불투명으로 덮는다.)
      */}
      {failed && (
        <div className="absolute inset-0 z-999 flex flex-col items-center justify-center gap-1 overflow-auto bg-muted px-4 text-center">
          <MapPin size={22} className="text-muted-foreground" aria-hidden />
          <p className="text-xs font-medium text-foreground">{address}</p>
          <p className="text-[10px] text-muted-foreground">지도를 불러오지 못했습니다</p>

          {/* 개발 중에만 보이는 원인 표시. 배포본(npm run build)에서는 나오지 않는다. */}
          {import.meta.env.DEV && detail.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-left text-[9px] leading-tight text-muted-foreground">
              {detail.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
