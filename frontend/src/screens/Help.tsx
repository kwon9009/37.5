import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, BookOpen, ChevronDown, ExternalLink } from "lucide-react"
import { Screen, TopBar } from "@/components/Screen"
import { BottomNav } from "@/components/BottomNav"
import { faqs } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function Help() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<number | null>(0)

  const filtered = faqs.filter((f) => f.q.includes(query) || f.a.includes(query))

  return (
    <Screen>
      <TopBar title="도움말" logo />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4">
          <Search size={18} className="text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="내용 검색"
            className="h-13 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
            aria-label="도움말 검색"
          />
        </div>

        <button
          onClick={() => navigate("/emergency/guide")}
          className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-primary p-5 text-left text-primary-foreground"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/15">
            <BookOpen size={22} aria-hidden />
          </span>
          <span>
            <span className="block font-bold">응급 대응 가이드 안내</span>
            <span className="block text-sm text-primary-foreground/80">낙상 등 응급 상황 대처법을 확인하세요</span>
          </span>
        </button>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">자주 묻는 질문</h2>
        <ul className="space-y-2">
          {filtered.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="flex-1 font-medium text-foreground">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={cn("text-muted-foreground transition", isOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <p className="fade-up border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                )}
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</li>
          )}
        </ul>

        {/* 추가 문의 (구글폼 링크) */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="font-semibold text-foreground">원하는 답변을 찾지 못하셨나요?</p>
          <p className="mt-1 text-sm text-muted-foreground">아래 문의 양식을 통해 궁금한 점을 남겨 주세요.</p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd_37_5_health_inquiry/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            추가 문의하기
            <ExternalLink size={18} aria-hidden />
          </a>
        </div>
      </div>
      <BottomNav />
    </Screen>
  )
}
