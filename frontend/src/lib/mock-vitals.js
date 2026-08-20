/**
 * 시연용 목업 생체값.
 *
 * 실측 센서는 김철수(patient_id=1) 한 명에게만 붙어 있다. 나머지 환자는
 * 서버에 값이 없어 화면이 "--" 나 멈춘 그래프로 보이는데, 시연 영상에서는
 * 병동 전체가 돌아가는 것처럼 보여야 해서 여기서 파형을 만들어 준다.
 *
 * 중요한 규칙 두 가지:
 *  - 화면에 크게 뜨는 숫자는 그래프의 "맨 오른쪽 값"과 반드시 같아야 한다.
 *    그래서 어느 화면이든 series() 결과의 마지막 원소를 숫자로 쓴다.
 *  - 같은 환자는 어느 화면에서 보든, 새로고침해도 같은 파형이어야 한다.
 *    그래서 난수를 쓰지 않고 환자 번호를 시드로 한 결정적 함수로 만든다.
 */

/** 실제 센서가 붙어 있는 환자. 이 환자만 진짜 측정값을 쓴다. */
export const LIVE_PATIENT_ID = 1;

/** 생체값 종류별 기준선과 흔들림 폭. 정상 범위를 크게 벗어나지 않게 잡았다. */
const PROFILE = {
  heart: { base: 78, slow: 11, fast: 3.5 },
  resp: { base: 16, slow: 3, fast: 1.2 },
};

/**
 * 결정적 의사난수. 같은 입력이면 항상 같은 값(0~1)을 돌려준다.
 * 새로고침해도 파형이 유지돼야 해서 Math.random 을 쓰지 않는다.
 */
function noise(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 한 시점의 값.
 *
 * 느린 사인파(전체 추세) + 빠른 톱니(박동 느낌)를 겹친다.
 * 톱니가 없으면 매끈한 곡선이 되어 실제 생체신호처럼 보이지 않는다.
 */
/**
 * 환자별 기준선 보정.
 *
 * 그냥 두면 49명이 거의 다 "정상"으로 나와서 경고·응급 필터를 눌러도 빈 화면이 된다.
 * 시연에서 네 등급을 모두 보여줄 수 있도록 일부 환자를 위쪽 구간에 배치한다.
 * 환자 번호로만 정하므로 새로고침해도 같은 환자가 같은 등급대에 남는다.
 */
function severityBias(pid, kind) {
  const heartShift = pid % 23 === 5 ? 58 : pid % 13 === 4 ? 36 : pid % 5 === 2 ? 15 : 0;
  if (kind === "heart") return heartShift;
  // 호흡은 심박만큼 벌리지 않는다(둘 다 튀면 실제 환자처럼 안 보인다)
  return heartShift > 0 ? Math.round(heartShift / 9) : 0;
}

export function mockValue(patientId, kind, tick) {
  const p = PROFILE[kind] ?? PROFILE.heart;
  const pid = Number(patientId) || 1;
  const phase = pid * 7.3;

  const slow = Math.sin(tick * 0.12 + phase) * p.slow + Math.sin(tick * 0.047 + phase * 1.7) * p.slow * 0.4;
  // 인접한 점끼리 확실히 어긋나게 해서 꺾은선이 뾰족하게 보이도록 한다
  const jitter = (noise(tick * 3.1 + pid * 17) - 0.5) * 2 * p.fast;

  return Math.round(p.base + severityBias(pid, kind) + slow + jitter);
}

/**
 * 그래프에 그릴 값 배열. 왼쪽이 과거, 오른쪽이 현재다.
 * tick 이 1 늘 때마다 파형이 한 칸 왼쪽으로 밀린다.
 */
export function mockSeries(patientId, kind, count, tick) {
  return Array.from({ length: count }, (_, i) => mockValue(patientId, kind, tick - (count - 1 - i)));
}

/** 화면에 표시할 현재 숫자. 그래프 맨 오른쪽 값과 같아야 하므로 여기서 함께 뽑는다. */
export function mockCurrent(patientId, kind, tick) {
  return mockValue(patientId, kind, tick);
}

/** 이 환자를 목업으로 그려야 하는가. */
export function isMockPatient(patientId) {
  return Number(patientId) !== LIVE_PATIENT_ID;
}
