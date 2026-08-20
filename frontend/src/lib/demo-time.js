/**
 * 시연용 시간 압축.
 *
 * 시연 영상을 찍으려고 두세 시간씩 측정할 수는 없어서, 짧게 잰 기록을
 * 하루치처럼 펼쳐 보여주는 장치다. .env 의 VITE_CHART_BUCKET=minute 로 켠다.
 *
 * 배율 120 = 실제 30초를 화면상 1시간으로 본다.
 *   → 12분만 재면 24칸(하루치) 그래프가 꽉 찬다.
 *
 * 백엔드도 맞춰야 한다. vital_logs 가 30초마다 쌓여야 24칸이 채워지므로
 * backend/.env 의 VITAL_LOG_INTERVAL_SEC=30 과 짝을 이룬다.
 *
 * 화면 구성은 평소와 똑같다. 기록이 "어느 칸에 들어가느냐"만 달라진다.
 */

export const DEMO_MODE = import.meta.env.VITE_CHART_BUCKET === "minute";

/** 실제 경과 시간을 몇 배로 늘려 보여줄지. 30초 × 120 = 1시간. */
export const DEMO_TIME_FACTOR = 120;

/**
 * 기록 시각을 화면에 그릴 시각으로 바꾼다.
 * 평소 모드에서는 손대지 않고 그대로 돌려준다.
 */
export function toDisplayTime(value, nowMs = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return date;
  if (!DEMO_MODE) return date;
  // "몇 초 전"을 "몇 분 전"으로 늘린다. 방금 잰 값은 지금 자리에 그대로 남는다.
  return new Date(nowMs - (nowMs - date.getTime()) * DEMO_TIME_FACTOR);
}
