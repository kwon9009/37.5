import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, Building2 } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"

const hospitals = [
  { name: "서울요양병원", address: "서울 강남구 테헤란로 123" },
  { name: "행복한노인전문병원", address: "서울 서초구 반포대로 45" },
  { name: "미소재활요양병원", address: "경기 성남시 분당구 정자로 67" },
  { name: "온누리실버케어병원", address: "서울 송파구 올림픽로 89" },
]

export default function Hospital() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = hospitals.filter(
    (h) => h.name.includes(query) || h.address.includes(query),
  )

  return (
    <Screen>
      <TopBar title="병원 선택" back />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="space-y-3 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">환자가 입원한 병원을 찾아주세요</h2>
            <p className="mt-1 text-sm text-muted-foreground">병원명 또는 지역으로 검색할 수 있습니다.</p>
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

          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary">
            <MapPin size={18} aria-hidden />
            지도에서 병원 선택
          </button>
        </div>

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
      </div>
      <div className="border-t border-border bg-card px-5 py-4">
        <Button disabled={!selected} onClick={() => navigate("/waiting")}>
          이 병원으로 신청하기
        </Button>
      </div>
    </Screen>
  )
}
