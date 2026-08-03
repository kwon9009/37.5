// 환자 1명의 실시간 생체값을 구독하는 React 훅.
// 실제 접속·재연결 처리는 api/vital-stream.js가 담당한다.
//
// 주의: 로그인이 되어 있어야 한다(스트림 접속 티켓 발급에 로그인 토큰이 필요).
import { useEffect, useState } from "react";
import { openVitalStream } from "./vital-stream.js";

export function useVitals(patientId) {
  const [vitals, setVitals] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "connected" | "error"

  useEffect(() => {
    if (patientId == null) return;

    setStatus("loading");
    setVitals(null);

    return openVitalStream({
      scope: "patient",
      patientId,
      onVitals: setVitals,
      onConnectionChange: (connected) => setStatus(connected ? "connected" : "error"),
    });
  }, [patientId]);

  return { vitals, status }; // vitals: { heart_rate, resp_rate, status, presence, ... } | null
}
