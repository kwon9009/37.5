import { useEffect, useState } from "react";

/**
 * 1초마다 1씩 오르는 카운터.
 *
 * 목업 파형을 오른쪽에서 왼쪽으로 흐르게 하는 데 쓴다. 화면마다 따로 세도
 * 파형은 tick 값으로만 결정되므로(mock-vitals.js 참고) 같은 환자는 어느
 * 화면에서든 같은 모양으로 보인다.
 *
 * @param {boolean} enabled false면 타이머를 걸지 않는다(실측 환자만 있는 화면 등)
 */
export function useMockTick(enabled = true) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  return tick;
}
