"""실측 기록(NDJSON)을 읽어 규칙 판정과 예측 모델을 비교한다.

무엇을 보나:
  1) 센서가 얼마나 쓸만한 값을 줬는지 (버려진 측정 비율)
  2) 실제로 측정된 심박·호흡 분포
  3) NEWS2 규칙 판정과 예측 모델 판정이 어디서 갈렸는지
  4) 모델이 등급을 올린 초가 전체의 몇 %인지  <- 조기경보의 실질 비용
  5) 모델이 댄 사유는 주로 무엇인지

실행 (backend 폴더에서, venv 켠 상태로):
  PYTHONPATH=. python scripts/analyze_vital_record.py records/session1.ndjson
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ORDER = ["NORMAL", "WARNING", "ALERT", "DANGER"]


def load(path: Path) -> list[dict]:
    rows = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            print(f"  (건너뜀) {number}번째 줄을 읽지 못했습니다")
    return rows


def percent(count: int, total: int) -> str:
    return f"{count / total * 100:5.1f}%" if total else "    -"


def describe(values: list[float], label: str) -> None:
    if not values:
        print(f"  {label}: 측정값 없음")
        return
    values = sorted(values)
    n = len(values)
    mean = sum(values) / n
    median = values[n // 2]
    print(
        f"  {label}: 최소 {values[0]:.0f} / 중앙 {median:.0f} / 평균 {mean:.1f} "
        f"/ 최대 {values[-1]:.0f}   (n={n})"
    )


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    path = Path(sys.argv[1])

    if not path.exists():
        print(f"파일이 없습니다: {path}")
        sys.exit(1)

    rows = load(path)

    if not rows:
        print("기록이 비어 있습니다.")
        sys.exit(1)

    total = len(rows)

    print("=" * 66)
    print(f"실측 기록 분석 : {path.name}")
    print("=" * 66)
    print(f"측정 건수 : {total}건")
    print(f"기간      : {rows[0]['t']} ~ {rows[-1]['t']}")
    print(f"환자      : {sorted({r['pid'] for r in rows})}")
    print()

    # 1) 센서 품질 -----------------------------------------------------
    print("[1] 센서 품질")
    saved = [r for r in rows if r.get("saved")]
    absent = [r for r in rows if not r.get("presence")]
    stabilizing = [r for r in rows if r.get("stabilizing")]
    replaced = [r for r in saved if r.get("resp_replaced")]

    print(f"  저장된 측정      {len(saved):5}건 ({percent(len(saved), total)})")
    print(f"  사람 없음        {len(absent):5}건 ({percent(len(absent), total)})")
    print(f"  안정화 중        {len(stabilizing):5}건 ({percent(len(stabilizing), total)})")
    print(f"  호흡 이어쓰기    {len(replaced):5}건 ({percent(len(replaced), total)})")

    rejected = Counter(r["rejected"] for r in rows if r.get("rejected"))
    if rejected:
        print("  버려진 이유:")
        for name, count in rejected.most_common():
            print(f"    - {name:20} {count:5}건 ({percent(count, total)})")
    print()

    # 2) 실측 분포 -----------------------------------------------------
    print("[2] 실제 측정된 생체값 (저장된 것만)")
    describe([r["hr"] for r in saved if r.get("hr") is not None], "심박")
    describe(
        [r["rr"] for r in saved if r.get("rr") is not None and not r.get("resp_replaced")],
        "호흡",
    )
    print()

    # 3) 판정 비교 -----------------------------------------------------
    # 모델이 실제로 돌아간 건만 비교한다(호흡 미신뢰 시엔 모델을 안 돌린다).
    compared = [r for r in saved if r.get("model") is not None]

    print("[3] 규칙(NEWS2) vs 예측 모델")
    print(f"  모델이 판정한 측정 : {len(compared)}건 / 저장 {len(saved)}건")

    if not compared:
        print("  모델이 한 번도 돌지 않았습니다.")
        print("  (EARLY_WARNING_ENABLED가 꺼져 있거나, 60초 윈도우가 안 찼을 수 있습니다)")
        return

    print()
    print("  NEWS2 판정 분포")
    news2 = Counter(r["news2"] for r in compared)
    for name in ORDER:
        if news2[name]:
            print(f"    {name:9} {news2[name]:5}건 ({percent(news2[name], len(compared))})")

    print()
    print("  모델 판정 분포 (ALERT 상한 적용 전 원판정)")
    model = Counter(r["model"] for r in compared)
    for name in ORDER + sorted(set(model) - set(ORDER)):
        if model[name]:
            print(f"    {name:9} {model[name]:5}건 ({percent(model[name], len(compared))})")

    print()
    print("  최종 화면 등급 분포")
    final = Counter(r["final"] for r in compared)
    for name in ORDER:
        if final[name]:
            print(f"    {name:9} {final[name]:5}건 ({percent(final[name], len(compared))})")
    print()

    # 4) 핵심 지표 -----------------------------------------------------
    raised = [r for r in compared if r["final"] != r["news2"]]
    normal_but_raised = [r for r in raised if r["news2"] == "NORMAL"]

    print("[4] 조기경보가 실제로 한 일")
    print(f"  모델이 등급을 올린 측정        {len(raised):5}건 ({percent(len(raised), len(compared))})")
    print(
        f"  그중 규칙은 '정상'이던 측정    {len(normal_but_raised):5}건 "
        f"({percent(len(normal_but_raised), len(compared))})"
    )

    if normal_but_raised:
        upgraded = Counter(r["final"] for r in normal_but_raised)
        print("    올라간 등급:", dict(upgraded))
        print()
        print("  ⚠ 이 건들은 규칙상 정상인 사람을 모델이 경보로 올린 것입니다.")
        print("    실제로 환자에게 이상이 없었다면 전부 오탐입니다.")
    print()

    # 5) 모델 점수 -----------------------------------------------------
    scores = [r["score"] for r in compared if r.get("score") is not None]
    if scores:
        scores_sorted = sorted(scores)
        n = len(scores_sorted)
        print("[5] 모델 이상 점수 (0~100, 40 이상 주의 / 70 이상 경보)")
        print(
            f"  최소 {scores_sorted[0]:.1f} / 25% {scores_sorted[n // 4]:.1f} / "
            f"중앙 {scores_sorted[n // 2]:.1f} / 75% {scores_sorted[3 * n // 4]:.1f} / "
            f"최대 {scores_sorted[-1]:.1f}"
        )
        under40 = sum(1 for s in scores if s < 40)
        print(f"  40 미만(정상 판정) : {under40}건 ({percent(under40, n)})")
        print()

    # 6) 사유 ----------------------------------------------------------
    reasons = Counter()
    for row in compared:
        for reason in row.get("reasons") or []:
            reasons[reason] += 1

    if reasons:
        print("[6] 모델이 댄 사유 (많은 순)")
        for reason, count in reasons.most_common(8):
            print(f"  {count:5}회  {reason}")


if __name__ == "__main__":
    main()
