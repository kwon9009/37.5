// 서버의 실시간 스트림(SSE)을 구독하는 React 훅 (뼈대 예시)
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useVitals(patientId) {
  const [vitals, setVitals] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "connected" | "error"

  useEffect(() => {
    setStatus("loading");
    setVitals(null);

    const es = new EventSource(`${API}/api/stream/${patientId}`);
    es.onmessage = (e) => {
      setVitals(JSON.parse(e.data));
      setStatus("connected");
    };
    es.onerror = () => {
      setStatus("error");
      es.close(); // 실제 서비스에선 재연결 로직 추가
    };
    return () => es.close();
  }, [patientId]);

  return { vitals, status }; // vitals: { heart_rate, breath_rate, ... } | null
}
