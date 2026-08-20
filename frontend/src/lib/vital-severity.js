/**
 * 심박·호흡 수치에서 화면 배지 등급을 정한다.
 *
 * 실측 환자든 목업 환자든 "화면에 보이는 숫자"로 등급을 매긴다.
 * 서버가 저장해 둔 status 를 그대로 쓰면, 값은 갱신됐는데 등급은 예전 것이
 * 남아 "호흡 10인데 정상" 같은 화면이 나온다.
 *
 * 경계는 보호자 앱과 같은 기준(NEWS2)이다.
 *   심박  ≤40 / ≥131 = 3점,  41~50·111~130 = 2점,  51~60·91~110 = 1점
 *   호흡  ≤8 / ≥25   = 3점,  21~24 = 2점,          9~11 = 1점
 *
 * 주의: 참고용 선별 표시이지 진단이 아니다. 최종 판단은 의료진이 한다.
 */

function heartScore(v) {
  if (v == null) return 0;
  if (v <= 40 || v >= 131) return 3;
  if (v <= 50 || v >= 111) return 2;
  if (v <= 60 || v >= 91) return 1;
  return 0;
}

function respScore(v) {
  if (v == null) return 0;
  if (v <= 8 || v >= 25) return 3;
  if (v >= 21) return 2;
  if (v <= 11) return 1;
  return 0;
}

const SEVERITY_BY_SCORE = ["normal", "caution", "warning", "emergency"];

/** 둘 중 나쁜 쪽을 등급으로 삼는다. 값이 없으면 판정하지 않고 null. */
export function severityFromVitals(heartRate, respirationRate) {
  if (heartRate == null && respirationRate == null) return null;
  const score = Math.max(heartScore(heartRate), respScore(respirationRate));
  return SEVERITY_BY_SCORE[score] ?? "normal";
}
