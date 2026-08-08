import { useEffect, useMemo, useState } from "react"

import { apiClient } from "@/api/client.js"
import { findPoint, getKakao, loadKakaoSdk } from "@/guardian/lib/kakao-geocode"

/**
 * 개발용 화면 — 병원 주소가 카카오 지도에서 실제로 찾아지는지 한 번에 점검한다.
 *
 * 왜 필요한가:
 *   보호자 앱은 병원 "주소"를 카카오에 물어 좌표로 바꾼 뒤 지도를 그린다.
 *   그런데 실재하는 병원인데도 카카오가 못 찾는 경우가 있다.
 *   화면에서 하나씩 눌러 확인하면 63개를 다 볼 수 없어서, 여기서 한꺼번에 돌린다.
 *
 * 여는 방법: 개발 서버에서 /dev/hospital-map
 * 주의: 실제 화면(KakaoMap)과 똑같은 검색 로직(guardian/lib/kakao-geocode)을 쓴다.
 *      점검 결과와 실제 화면이 어긋나면 점검하는 의미가 없기 때문이다.
 */

type Hospital = {
  hospital_id: number
  hospital_code: string
  name: string
  area: string
  address: string
}

type Row = Hospital & {
  state: "대기" | "검사중" | "성공" | "실패"
  lat?: number
  lng?: number
  matchedBy?: string | null
  steps?: string[]
}

export default function DevHospitalMap() {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [onlyFailed, setOnlyFailed] = useState(false)

  // 병원 목록 불러오기 (63개 전부 받아야 해서 limit 을 크게 준다)
  useEffect(() => {
    apiClient
      .get("/hospitals", { params: { limit: 200 } })
      .then(({ data }) => {
        const list: Row[] = (data as Hospital[]).map((h) => ({ ...h, state: "대기" }))
        setRows(list)
      })
      .catch((e: Error) => setError(`병원 목록을 못 불러왔습니다: ${e.message}`))
  }, [])

  const summary = useMemo(() => {
    const total = rows.length
    const ok = rows.filter((r) => r.state === "성공").length
    const fail = rows.filter((r) => r.state === "실패").length
    return { total, ok, fail, checked: ok + fail }
  }, [rows])

  // 성공한 병원이 어떤 검색 단계에서 잡혔는지 세어 본다.
  // (1단계에서 다 잡히면 뒤 단계는 필요 없다는 뜻이라 정리 근거가 된다)
  const byStep = useMemo(() => {
    const counter = new Map<string, number>()
    for (const row of rows) {
      if (row.state !== "성공" || !row.matchedBy) continue
      counter.set(row.matchedBy, (counter.get(row.matchedBy) ?? 0) + 1)
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  async function run() {
    setRunning(true)
    setDone(false)
    setError(null)

    try {
      await loadKakaoSdk()
    } catch (e) {
      setError(`카카오 지도 SDK 로드 실패: ${(e as Error).message}`)
      setRunning(false)
      return
    }

    const kakao = getKakao()

    // 카카오에 한꺼번에 몰아치지 않도록 하나씩 순서대로 돌린다.
    for (const [index, hospital] of rows.entries()) {
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, state: "검사중" } : r)),
      )

      const { point, steps, matchedBy } = await findPoint(
        kakao,
        hospital.address,
        hospital.name,
      )

      setRows((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                state: point ? "성공" : "실패",
                lat: point?.lat,
                lng: point?.lng,
                matchedBy,
                steps,
              }
            : r,
        ),
      )
    }

    setRunning(false)
    setDone(true)
  }

  /** 실패 목록을 붙여넣기 좋은 형태로 만든다 */
  function copyFailed() {
    const text = rows
      .filter((r) => r.state === "실패")
      .map((r) => `${r.hospital_code}\t${r.name}\t${r.address}`)
      .join("\n")
    navigator.clipboard.writeText(text || "(실패한 병원 없음)")
  }

  /** 성공한 좌표를 붙여넣기 좋은 형태로 만든다 (나중에 DB에 넣을 때 쓸 수 있다) */
  function copyCoords() {
    const text = rows
      .filter((r) => r.state === "성공")
      .map((r) => `${r.hospital_code}\t${r.lat}\t${r.lng}`)
      .join("\n")
    navigator.clipboard.writeText(text || "(성공한 병원 없음)")
  }

  if (!import.meta.env.DEV) {
    return <p className="p-8">개발 모드에서만 사용하는 화면입니다.</p>
  }

  const visible = onlyFailed ? rows.filter((r) => r.state === "실패") : rows

  return (
    <div className="mx-auto max-w-5xl p-6 text-sm">
      <h1 className="text-xl font-bold">병원 지도 일괄 점검</h1>
      <p className="mt-1 text-muted-foreground">
        DB의 병원 주소를 카카오 지도에서 찾을 수 있는지 하나씩 확인합니다.
        보호자 앱 지도와 똑같은 방법으로 검색합니다.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={running || rows.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-40"
        >
          {running ? `검사 중… (${summary.checked}/${summary.total})` : "검사 시작"}
        </button>
        <button
          onClick={copyFailed}
          disabled={!done}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          실패 목록 복사
        </button>
        <button
          onClick={copyCoords}
          disabled={!done}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          성공 좌표 복사
        </button>
        <label className="ml-2 flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={onlyFailed}
            onChange={(e) => setOnlyFailed(e.target.checked)}
          />
          실패한 것만 보기
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 rounded-xl border px-4 py-3">
        <span>전체 <b>{summary.total}</b></span>
        <span className="text-green-700">성공 <b>{summary.ok}</b></span>
        <span className="text-red-700">실패 <b>{summary.fail}</b></span>
        {summary.checked > 0 && (
          <span className="text-muted-foreground">
            성공률 <b>{Math.round((summary.ok / summary.checked) * 100)}%</b>
          </span>
        )}
      </div>

      {byStep.length > 0 && (
        <div className="mt-3 rounded-xl border px-4 py-3">
          <p className="font-semibold">어떤 검색으로 찾았나</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {byStep.map(([step, count]) => (
              <li key={step}>
                {step} — {count}개
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-2">코드</th>
            <th className="py-2 pr-2">병원명</th>
            <th className="py-2 pr-2">주소</th>
            <th className="py-2 pr-2">결과</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.hospital_id} className="border-b align-top">
              <td className="py-1.5 pr-2 font-mono">{row.hospital_code}</td>
              <td className="py-1.5 pr-2">{row.name}</td>
              <td className="py-1.5 pr-2 text-muted-foreground">{row.address}</td>
              <td className="py-1.5 pr-2">
                {row.state === "성공" && (
                  <span className="text-green-700">
                    ✅ {row.matchedBy}
                    <br />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {row.lat?.toFixed(6)}, {row.lng?.toFixed(6)}
                    </span>
                  </span>
                )}
                {row.state === "실패" && (
                  <details className="text-red-700">
                    <summary className="cursor-pointer">❌ 못 찾음</summary>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                      {row.steps?.map((s) => (
                        <li key={s}>· {s}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {row.state === "검사중" && <span>⏳</span>}
                {row.state === "대기" && <span className="text-muted-foreground">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
