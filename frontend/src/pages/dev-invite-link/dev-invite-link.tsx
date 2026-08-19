import { useEffect, useMemo, useState } from "react"

import { apiClient } from "@/api/client.js"
import { buildInviteUrl, decodeInviteToken, INVITE_PARAM } from "@/guardian/lib/invite-link"

/**
 * 개발/운영 보조 화면 — 보호자에게 보낼 초대 링크를 만든다.
 *
 * 왜 필요한가:
 *   초대 링크에는 병원 코드가 그대로 들어가지 않고 섞여서(복호화 가능한 형태로) 들어간다.
 *   그래서 사람이 손으로는 만들 수 없다. 여기서 병원을 고르면 링크가 나오고,
 *   그대로 문자에 붙여 넣으면 된다.
 *
 * 여는 방법: 개발 서버에서 /dev/invite-link
 * 나중에: 백엔드가 응급 문자를 보낼 때 이 링크를 직접 만들어 넣게 되면
 *        같은 규칙(guardian/lib/invite-link.ts)을 파이썬으로 옮겨야 한다.
 */

type Hospital = {
  hospital_id: number
  hospital_code: string
  name: string
  area: string
  address: string
}

export default function DevInviteLink() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState("")
  const [code, setCode] = useState("")
  const [origin, setOrigin] = useState(window.location.origin)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiClient
      .get("/hospitals", { params: { limit: 200 } })
      .then(({ data }) => setHospitals(data as Hospital[]))
      .catch((e: Error) => setError(`병원 목록을 못 불러왔습니다(직접 입력은 가능): ${e.message}`))
  }, [])

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase()
    if (!key) return hospitals.slice(0, 30)
    return hospitals
      .filter((h) => h.name.toLowerCase().includes(key) || h.hospital_code.toLowerCase().includes(key))
      .slice(0, 30)
  }, [hospitals, keyword])

  // 링크 만들기. 코드 형식이 틀리면 만들지 않고 이유를 보여준다.
  const link = useMemo(() => {
    if (!code.trim()) return { url: "", problem: "" }
    try {
      return { url: buildInviteUrl(code, origin), problem: "" }
    } catch (e) {
      return { url: "", problem: (e as Error).message }
    }
  }, [code, origin])

  // 만든 링크를 다시 풀어본다. 앱이 읽어낼 값과 같은지 눈으로 확인하는 용도.
  const decoded = useMemo(() => {
    if (!link.url) return null
    // 도메인 칸에 아무 글자나 넣어도 화면이 죽지 않게 감싼다
    const token = link.url.split(`?${INVITE_PARAM}=`)[1]
    return token ? decodeInviteToken(token) : null
  }, [link.url])

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  if (!import.meta.env.DEV) {
    return <p className="p-8">개발 모드에서만 사용하는 화면입니다.</p>
  }

  // 병원이 실제로 보내는 문구. 병원명·전화번호는 보내기 전에 채운다.
  const hospitalName = hospitals.find((h) => h.hospital_code === code.trim())?.name ?? "○○요양병원"
  const smsText = link.url
    ? [
        `안녕하세요. ${hospitalName}입니다.`,
        "",
        "입원 중이신 환자분의 건강 상태를 보호자분께서 언제든 확인하실 수 있도록 보호자 전용 앱 설치 방법을 안내드립니다.",
        "",
        "▶ 앱 설치",
        link.url,
        "",
        "접속이 원활하지 않을 경우 링크를 길게 눌러 복사한 뒤, 아래 브라우저의 주소창에 붙여넣어 접속해 주세요.",
        "",
        "· 아이폰: Safari(사파리)",
        "· 안드로이드(갤럭시): Chrome(크롬)",
        "",
        "자세한 설치 방법은 첨부된 안내서를 참고해 주시기 바랍니다.",
        "",
        `📞 ${hospitalName} 원무과 (042-000-0000)`,
      ].join("\n")
    : ""

  return (
    <div className="mx-auto max-w-3xl p-6 text-sm">
      <h1 className="text-xl font-bold">보호자 초대 링크 만들기</h1>
      <p className="mt-1 text-muted-foreground">
        병원을 고르면 문자로 보낼 링크가 만들어집니다. 링크 주소에는 병원 코드가 그대로 보이지 않고,
        앱이 열릴 때 풀어서 자동으로 입력합니다.
      </p>

      {error && <p className="mt-4 rounded-lg bg-amber-100 px-4 py-3 text-amber-800">{error}</p>}

      {/* 배포 주소 */}
      <label className="mt-6 block">
        <span className="font-semibold">앱 주소(도메인)</span>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="https://example.com"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          실제 문자로 보낼 때는 배포된 주소를 넣어야 합니다. (지금 값: 이 브라우저 주소)
        </span>
      </label>

      {/* 병원 고르기 */}
      <div className="mt-6">
        <span className="font-semibold">병원 선택</span>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="병원 이름 또는 코드 검색"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border">
          {filtered.length === 0 && <p className="p-3 text-muted-foreground">검색 결과가 없습니다.</p>}
          {filtered.map((h) => (
            <button
              key={h.hospital_id}
              onClick={() => setCode(h.hospital_code)}
              className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted ${
                code === h.hospital_code ? "bg-blue-50" : ""
              }`}
            >
              <span className="truncate">
                {h.name} <span className="text-muted-foreground">· {h.area}</span>
              </span>
              <span className="shrink-0 font-mono text-xs">{h.hospital_code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 코드 직접 입력 (목록을 못 불러왔을 때) */}
      <label className="mt-4 block">
        <span className="font-semibold">병원 코드</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="예: DJ001"
          className="mt-1 w-full rounded-lg border px-3 py-2 font-mono"
        />
      </label>

      {link.problem && <p className="mt-3 rounded-lg bg-red-100 px-4 py-3 text-red-700">{link.problem}</p>}

      {link.url && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">초대 링크</p>
            <p className="mt-1 break-all font-mono text-xs">{link.url}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => copy(link.url)} className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white">
                링크 복사
              </button>
              <a href={link.url} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2">
                링크 열어보기
              </a>
              {copied && <span className="text-green-700">복사했습니다</span>}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              풀어보기(앱이 읽는 값): <b className="font-mono">{decoded ?? "실패"}</b>
              {" · "}같은 병원이라도 만들 때마다 링크 모양은 달라집니다.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="font-semibold">문자 문구 예시</p>
            <pre className="mt-1 whitespace-pre-wrap break-all text-xs">{smsText}</pre>
            <button onClick={() => copy(smsText)} className="mt-3 rounded-lg border px-3 py-2">
              문구 복사
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
