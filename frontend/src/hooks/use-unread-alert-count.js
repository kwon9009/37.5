import { useEffect, useState } from "react";
import { apiClient } from "../api/client.js";

// 헤더 벨/사이드바 배지가 같은 실제 안 읽은 알림 개수를 쓰도록 하는 공용 훅.
export function useUnreadAlertCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    apiClient
      .get("/dashboard/recent-alerts")
      .then(({ data }) => setCount(data.filter((alert) => !alert.is_read).length))
      .catch(() => {});
  }, []);

  return count;
}
