/**
 * 측정값이 "지금 재고 있는 값"인지 판단한다.
 *
 * 실측 센서는 1초마다 값을 보낸다. 측정을 멈추면 서버에는 마지막 값이 그대로
 * 남는데, 그걸 현재값처럼 띄우면 멈춘 센서를 정상 작동으로 오해하게 된다.
 * (실제로 이틀 전 값이 "현재 심박 74"로 떠 있었다)
 *
 * 그래서 일정 시간 안에 들어온 값만 화면에 표시하고, 오래된 값은 없는 것으로 본다.
 */

/** 이 시간이 지난 값은 "측정 중이 아님"으로 본다. 전송이 몇 초 밀릴 수 있어 넉넉히 잡았다. */
export const FRESH_WINDOW_SEC = 30;

export function isVitalFresh(measuredAt, maxAgeSec = FRESH_WINDOW_SEC) {
  if (!measuredAt) return false;
  const time = measuredAt instanceof Date ? measuredAt.getTime() : new Date(measuredAt).getTime();
  if (Number.isNaN(time)) return false;
  const ageSec = (Date.now() - time) / 1000;
  // 서버와 시계가 조금 어긋나 미래로 찍히는 경우도 정상으로 본다
  return ageSec < maxAgeSec && ageSec > -maxAgeSec;
}

/**
 * 측정 중이 아닌 실측 환자를 "값 없음" 상태로 바꾼다.
 * 숫자는 "--", 그래프는 그리지 않고, 등급 배지는 센서 없음으로 표시한다.
 *
 * 재실 여부도 함께 내린다. 재실은 센서가 사람을 감지해야 알 수 있는 값이라,
 * 측정을 멈춘 뒤에도 "재실중"으로 남겨두면 아무도 없는 병상이 재실로 보인다.
 */
export function withoutStaleVitals(patient, measuredAt) {
  if (isVitalFresh(measuredAt)) return patient;
  return {
    ...patient,
    heartRate: null,
    respirationRate: null,
    severity: "offline",
    series: undefined,
    present: false,
    presenceLabel: "부재중",
  };
}
