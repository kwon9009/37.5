import { useEffect, useState } from "react";
import { fetchLinkRequests } from "../api/patient-link-requests.js";

// 사이드바 "연동 요청" 배지가 실제 대기중인 건수를 쓰도록 하는 훅.
export function usePendingLinkRequestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchLinkRequests("대기중")
      .then((rows) => setCount(rows.length))
      .catch(() => {});
  }, []);

  return count;
}
