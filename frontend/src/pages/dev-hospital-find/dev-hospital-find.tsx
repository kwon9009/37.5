import { useEffect, useState } from "react"

import { apiClient } from "@/api/client.js"
import { getKakao, loadKakaoSdk, searchPlaces, type Place } from "@/guardian/lib/kakao-geocode"

/**
 * 개발용 화면 — 목업 병원 데이터로 쓸 "실제 요양병원"을 카카오에서 찾아온다.
 *
 * 왜 필요한가:
 *   목업 병원 주소를 그럴듯하게 지어냈더니, 실재하지 않는 주소라 지도가 안 떴다.
 *   카카오에 등록된 병원을 카카오한테 직접 물어보면 그런 일이 없다.
 *   여기서 나온 이름·주소를 그대로 쓰면 지도가 반드시 뜬다.
 *
 * 이미 DB에 있는 병원은 후보에서 빼준다. 안 그러면 같은 병원이 두 코드로 들어간다.
 *
 * 여는 방법: 개발 서버에서 /dev/hospital-find
 * 결과를 "고른 결과 복사" 로 복사해서 개발자에게 전달하면 목업 데이터에 반영한다.
 */

/**
 * 병원 코드별로 어느 동네에서 찾을지.
 * 지금 목업 데이터와 같은 지역 분포를 유지해서, 지역 선택 기능을 그대로 보여줄 수 있게 한다.
 */
const TARGETS: { code: string; area: string; keyword: string }[] = [
  { code: "SU001", area: "서울특별시", keyword: "서울특별시 강남구 요양병원" },
  { code: "SU002", area: "서울특별시", keyword: "서울특별시 마포구 요양병원" },
  { code: "SU003", area: "서울특별시", keyword: "서울특별시 은평구 요양병원" },
  { code: "SU004", area: "서울특별시", keyword: "서울특별시 송파구 요양병원" },
  { code: "SU005", area: "서울특별시", keyword: "서울특별시 관악구 요양병원" },

  { code: "GG001", area: "경기도", keyword: "성남시 분당구 요양병원" },
  { code: "GG002", area: "경기도", keyword: "수원시 팔달구 요양병원" },
  { code: "GG003", area: "경기도", keyword: "고양시 일산동구 요양병원" },
  { code: "GG004", area: "경기도", keyword: "용인시 기흥구 요양병원" },
  { code: "GG005", area: "경기도", keyword: "안양시 동안구 요양병원" },

  { code: "BS001", area: "부산광역시", keyword: "부산광역시 해운대구 요양병원" },
  { code: "BS002", area: "부산광역시", keyword: "부산광역시 부산진구 요양병원" },
  { code: "BS003", area: "부산광역시", keyword: "부산광역시 금정구 요양병원" },
  { code: "BS004", area: "부산광역시", keyword: "부산광역시 사하구 요양병원" },

  { code: "DG001", area: "대구광역시", keyword: "대구광역시 동구 요양병원" },
  { code: "DG002", area: "대구광역시", keyword: "대구광역시 수성구 요양병원" },
  { code: "DG003", area: "대구광역시", keyword: "대구광역시 달서구 요양병원" },
  { code: "DG004", area: "대구광역시", keyword: "대구광역시 중구 요양병원" },
]

/** 후보를 몇 개까지 보여줄지. 중복을 걸러내고도 고를 게 남도록 넉넉히 둔다 */
const CANDIDATES_PER_TARGET = 5

type Result = {
  code: string
  area: string
  keyword: string
  places: Place[]
  /** 이미 DB에 있어서 걸러낸 병원 이름들 (왜 후보가 적은지 보이게) */
  skipped: string[]
}

/** 이름을 비교하기 쉽게 다듬는다. "의료법인 ○○의료재단 " 같은 수식어와 띄어쓰기를 뺀다 */
function normalizeName(name: string): string {
  return name
    .replace(/의료법인|사회복지법인|의료재단|복지재단|재단|의\)/g, "")
    .replace(/\s+/g, "")
    .toLowerCase()
}

export default function DevHospitalFind() {
  const [results, setResults] = useState<Result[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [onlyYoyang, setOnlyYoyang] = useState(true)
  const [existing, setExisting] = useState<Set<string>>(new Set())

  // 이미 DB에 있는 병원 이름을 미리 받아둔다 (중복 후보를 걸러내려고)
  useEffect(() => {
    apiClient
      .get("/hospitals", { params: { limit: 200 } })
      .then(({ data }) => {
        const names = (data as { name: string }[]).map((h) => normalizeName(h.name))
        setExisting(new Set(names))
      })
      .catch((e: Error) => setError(`기존 병원 목록을 못 불러왔습니다: ${e.message}`))
  }, [])

  /** 카카오 검색 결과에서 쓸 만한 후보만 남긴다 */
  function filterPlaces(places: Place[]): { places: Place[]; skipped: string[] } {
    const skipped: string[] = []
    const kept: Place[] = []

    for (const place of places) {
      // 도로명주소가 있어야 한다. DB 주소 형식이 도로명이라 맞춰야 한다.
      if (!place.roadAddress) continue
      // 이름에 "요양"이 들어간 곳만 (재활병원·의원 등이 섞여 들어오는 것을 막는다)
      if (onlyYoyang && !place.name.includes("요양")) continue
      // 이미 DB에 있는 병원은 뺀다
      if (existing.has(normalizeName(place.name))) {
        skipped.push(place.name)
        continue
      }
      kept.push(place)
      if (kept.length >= CANDIDATES_PER_TARGET) break
    }

    return { places: kept, skipped }
  }

  async function run(targets: typeof TARGETS) {
    setRunning(true)
    setError(null)
    setResults([])
    setPicked({})

    try {
      await loadKakaoSdk()
    } catch (e) {
      setError(`카카오 지도 SDK 로드 실패: ${(e as Error).message}`)
      setRunning(false)
      return
    }

    const kakao = getKakao()
    const collected: Result[] = []

    for (const target of targets) {
      const found = await searchPlaces(kakao, target.keyword)
      collected.push({ ...target, ...filterPlaces(found) })
      setResults([...collected])
    }

    setRunning(false)
  }

  /** 아무 검색어나 직접 넣어볼 수 있게 한다 (예: 특정 병원이 카카오에 있는지 확인) */
  const [freeText, setFreeText] = useState("")
  function runFreeText() {
    if (!freeText.trim()) return
    void run([{ code: "직접검색", area: "-", keyword: freeText.trim() }])
  }

  /** 고른 병원들을 붙여넣기 좋은 형태로 복사한다 */
  function copyPicked() {
    const lines = results.map((r) => {
      const place = r.places[picked[r.code] ?? 0]
      if (!place) return `${r.code}\t(후보 없음)`
      return [r.code, r.area, place.name, place.roadAddress, place.phone].join("\t")
    })
    navigator.clipboard.writeText(lines.join("\n"))
  }

  if (!import.meta.env.DEV) {
    return <p className="p-8">개발 모드에서만 사용하는 화면입니다.</p>
  }

  return (
    <div className="mx-auto max-w-5xl p-6 text-sm">
      <h1 className="text-xl font-bold">목업용 실제 요양병원 찾기</h1>
      <p className="mt-1 text-muted-foreground">
        카카오에 등록된 요양병원을 지역별로 찾아옵니다. 여기서 나온 병원은
        카카오가 이미 알고 있는 곳이라 지도가 반드시 뜹니다.
        이미 DB에 있는 병원({existing.size}개)은 후보에서 빠집니다.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => void run(TARGETS)}
          disabled={running}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-40"
        >
          {running ? `찾는 중… (${results.length}/${TARGETS.length})` : "타지역 18개 찾기"}
        </button>
        <button
          onClick={copyPicked}
          disabled={running || results.length === 0}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          고른 결과 복사
        </button>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={onlyYoyang}
            onChange={(e) => setOnlyYoyang(e.target.checked)}
          />
          이름에 "요양"이 들어간 곳만
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runFreeText()}
          placeholder="직접 검색 (예: 보아스, 대전 서구 도산로 요양병원)"
          className="w-80 rounded-lg border px-3 py-2"
        />
        <button
          onClick={runFreeText}
          disabled={running}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          직접 검색
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {results.map((result) => (
          <div key={result.code} className="rounded-xl border px-4 py-3">
            <p className="font-semibold">
              <span className="font-mono">{result.code}</span>
              <span className="ml-2 text-muted-foreground">{result.keyword}</span>
            </p>

            {result.skipped.length > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                이미 DB에 있어서 제외: {result.skipped.join(", ")}
              </p>
            )}

            {result.places.length === 0 ? (
              <p className="mt-1 text-red-700">쓸 만한 후보를 못 찾았습니다</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {result.places.map((place, index) => (
                  <li key={`${place.name}-${place.roadAddress}`}>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name={result.code}
                        className="mt-1"
                        checked={(picked[result.code] ?? 0) === index}
                        onChange={() =>
                          setPicked((prev) => ({ ...prev, [result.code]: index }))
                        }
                      />
                      <span>
                        <b>{place.name}</b>
                        <span className="ml-2 text-muted-foreground">
                          {place.roadAddress}
                        </span>
                        {place.phone && (
                          <span className="ml-2 text-muted-foreground">{place.phone}</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
