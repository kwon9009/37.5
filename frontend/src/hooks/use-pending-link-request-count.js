import { useEffect, useState } from "react";
import { fetchLinkRequests } from "../api/patient-link-requests.js";

/**
 * 사이드바 "연동 요청" 배지에 쓸, 아직 처리하지 않은 요청 건수.
 *
 * 예전에는 3으로 고정돼 있어서 요청이 없어도 3이 떠 있었다.
 * 실제 대기 건수를 세고, 0이면 배지를 숨긴다(호출한 쪽에서 판단).
 */
export function usePendingLinkRequestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchLinkRequests("대기중")
      .then((rows) => {
        if (!cancelled) setCount(rows.length);
      })
      .catch(() => {
        // 권한이 없거나 서버가 안 붙은 상태면 배지를 띄우지 않는다.
        // 실제보다 많아 보이는 것보다 안 보이는 쪽이 낫다.
        if (!cancelled) setCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
