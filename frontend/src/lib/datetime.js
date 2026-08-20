/**
 * 화면에 시각을 표시하는 공용 함수들.
 *
 * 시:분:초만 보여주면 "어제 것인지 오늘 것인지" 알 수 없다. 알림이나
 * 응급 기록처럼 날짜가 넘어갈 수 있는 값은 반드시 연월일까지 함께 보여준다.
 * 반대로 그래프 가로축처럼 짧은 구간을 촘촘히 찍는 곳은 시각만 쓴다
 * (날짜를 넣으면 라벨이 겹쳐서 읽을 수 없다).
 */

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "2026. 08. 20. 14:23:05" — 알림·기록 등 날짜가 중요한 곳. */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}. ${date.toLocaleTimeString("ko-KR", { hour12: false })}`;
}

/** "08. 20. 14:23" — 목록처럼 폭이 좁은 곳. 연도는 생략한다. */
export function formatShortDateTime(value) {
  const date = toDate(value);
  if (!date) return "";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${m}. ${d}. ${hh}:${mm}`;
}

/** "14:23:05" — 그래프 가로축처럼 같은 날 안에서만 비교하는 곳. */
export function formatTimeOnly(value) {
  const date = toDate(value);
  return date ? date.toLocaleTimeString("ko-KR", { hour12: false }) : "";
}

/**
 * "방금 / 12분 전 / 3시간 전", 하루가 넘으면 날짜와 시각.
 * 하루가 넘었는데 날짜만 보여주면 몇 시 일인지 알 수 없어 시각도 같이 준다.
 */
export function formatRelative(value) {
  const date = toDate(value);
  if (!date) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return formatDateTime(date);
}
