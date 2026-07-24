import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, Building2, List, Map as MapIcon } from "lucide-react"
import { Screen, TopBar, StickyAction } from "@/components/Screen"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"

// 대전 내 요양병원 (데모 데이터 · 좌표는 지도 마커 배치용 상대 좌표 %)
const hospitals = [
  { name: "대전요양병원", address: "대전 중구 문화로 282", x: 46, y: 58 },
  { name: "한밭실버요양병원", address: "대전 서구 둔산로 100", x: 34, y: 48 },
  { name: "유성온천요양병원", address: "대전 유성구 온천북로 55", x: 24, y: 34 },
  { name: "대덕행복요양병원", address: "대전 대덕구 계족로 210", x: 62, y: 30 },
  { name: "동구사랑요양병원", address: "대전 동구 동서대로 1720", x: 70, y: 62 },
]

export default function Hospital() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "map">("list")

  const filtered = hospitals.filter(
    (h) => h.name.includes(query) || h.address.includes(query),
  )

  return (
    <Screen>
      <TopBar title="병원 선택" back />
      <StickyAction
        action={
          <Button disabled={!selected} onClick={() => navigate("/waiting")}>
            이 병원으로 신청하기
          </Button>
        }
      >
        <div className="space-y-3 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">환자가 입원한 요양병원을 찾아주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">대전 지역 요양병원을 병원명·지역으로 검색할 수 있습니다.</p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4">
            <Search size={18} className="text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="병원명 · 지역 검색"
              className="h-13 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
              aria-label="병원 검색"
            />
          </div>

          {/* 목록 / 지도 보기 토글 */}
          <div role="radiogroup" aria-label="보기 방식" className="flex gap-1.5 rounded-2xl bg-muted p-1">
            <button
              role="radio"
              aria-checked={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition",
                view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <List size={16} aria-hidden />
              목록
            </button>
            <button
              role="radio"
              aria-checked={view === "map"}
              onClick={() => setView("map")}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition",
                view === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <MapIcon size={16} aria-hidden />
              지도
            </button>
          </div>
        </div>

        {view === "map" ? (
          <div className="px-5 pb-4">
            {/* 구글 지도 API 연결 플레이스홀더
                실제 연동 시 이 컨테이너를 Google Maps JS API 로 교체:
                <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY">
                new google.maps.Map(el, { center: 대전(36.35,127.38), zoom: 12 }) */}
            <div
              className="relative h-72 w-full overflow-hidden rounded-3xl border border-border bg-muted"
              role="img"
              aria-label="대전 지역 요양병원 지도"
            >
              <div className="absolute inset-0 grid place-items-center text-center">
                <div className="px-6">
                  <MapIcon size={28} className="mx-auto text-muted-foreground/70" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">Google Maps 연결 영역</p>
                  <p className="text-xs text-muted-foreground/70">대전 지역 · 지도 API 키 연동 예정</p>
                </div>
              </div>

              {/* 병원 위치 마커 (검색 결과 기준) */}
              {filtered.map((h) => (
                <button
                  key={h.name}
                  onClick={() => setSelected(h.name)}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  aria-label={`${h.name} 선택`}
                  aria-pressed={selected === h.name}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border-2 border-card shadow-md transition",
                      selected === h.name ? "scale-125 bg-primary text-primary-foreground" : "bg-danger text-danger-foreground",
                    )}
                  >
                    <MapPin size={16} aria-hidden />
                  </span>
                </button>
              ))}
            </div>

            {selected && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary bg-primary/5 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 size={20} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{selected}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {hospitals.find((h) => h.name === selected)?.address}
                  </span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <ul className="flex-1 space-y-2 px-5 pb-4">
            {filtered.map((h) => (
              <li key={h.name}>
                <button
                  onClick={() => setSelected(h.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
                    selected === h.name
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                    <Building2 size={20} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{h.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{h.address}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</li>
            )}
          </ul>
        )}
      </StickyAction>
    </Screen>
  )
}
