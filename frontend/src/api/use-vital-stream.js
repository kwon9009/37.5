// 생체값 실시간 구독을 화면에서 쉽게 쓰기 위한 React 훅.
// 접속·재연결 자체는 api/vital-stream.js가 담당하고, 여기서는 화면 수명주기에 맞춰
// 열고 닫는 일만 한다.
//
// 사용 예)
//   const connected = useVitalStream({
//     scope: "department",                  // 우리 부서 환자 전체
//     onVitals: (v) => setPatients(...),    // 값이 올 때마다 호출
//   })
import { useEffect, useRef, useState } from "react";
import { openVitalStream } from "./vital-stream.js";

/**
 * @param {object}  options
 * @param {"patient"|"department"} options.scope
 * @param {number|string} [options.patientId]  scope가 "patient"일 때 필요
 * @param {(payload: object) => void} options.onVitals
 * @param {boolean} [options.enabled]  false면 구독하지 않는다
 * @returns {boolean} 지금 실시간으로 연결돼 있는지
 */
export function useVitalStream({ scope, patientId, onVitals, enabled = true }) {
  const [connected, setConnected] = useState(false);

  // 값이 올 때 실행할 함수를 ref에 담아둔다.
  // 그냥 의존성에 넣으면 화면이 다시 그려질 때마다 스트림이 끊겼다 다시 붙는다.
  const handlerRef = useRef(onVitals);
  handlerRef.current = onVitals;

  useEffect(() => {
    if (!enabled) return;
    if (scope === "patient" && (patientId == null || patientId === "")) return;

    return openVitalStream({
      scope,
      patientId: patientId == null ? undefined : Number(patientId),
      onVitals: (payload) => handlerRef.current?.(payload),
      onConnectionChange: setConnected,
    });
  }, [scope, patientId, enabled]);

  return connected;
}

// 실시간이 살아있으면 느리게, 끊겼으면 빠르게 다시 불러오는 주기(ms).
// 스트림으로 오지 않는 값(알림 목록, 환자 등록 등)을 따라잡기 위한 폴백이다.
export const POLL_SLOW_MS = 30000;
export const POLL_FAST_MS = 5000;

export function pollInterval(connected) {
  return connected ? POLL_SLOW_MS : POLL_FAST_MS;
}
