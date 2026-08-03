// 실시간 생체값 스트림(SSE) 연결 도우미. 웹 대시보드와 보호자 앱이 함께 쓴다.
//
// 접속 절차가 두 단계인 이유
//   브라우저의 SSE 도구(EventSource)는 요청 헤더를 붙일 수 없어서
//   평소처럼 로그인 토큰을 헤더로 보낼 수가 없다.
//   그래서 (1) 로그인 토큰으로 1회용 티켓을 먼저 받고
//         (2) 그 티켓만 주소에 붙여 접속한다.
//   티켓은 60초짜리 1회용이라 주소에 남아도 위험하지 않다.
//
// 티켓이 1회용이라 브라우저의 자동 재연결 기능을 쓸 수 없다(같은 티켓을 재사용하므로).
// 대신 연결이 끊기면 여기서 티켓을 새로 받아 다시 붙는다.
import { apiClient } from "./client.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const RETRY_BASE_MS = 1000; // 첫 재연결 대기
const RETRY_MAX_MS = 30000; // 최대 재연결 대기 (계속 실패해도 서버를 두들기지 않도록)

/**
 * 서버가 밀어주는 측정값 1건.
 *
 * heart_rate / resp_rate가 null이면 "이번엔 갱신할 값이 없음"이라는 뜻이다.
 * (부재중이거나, 센서 안정화 중이거나, 측정오류로 걸러진 경우)
 * 이때 화면은 직전 값을 그대로 두고 presence/status만 반영하면 된다.
 *
 * @typedef  {object} VitalPayload
 * @property {number}      patient_id
 * @property {number}      department_id
 * @property {number|null} heart_rate   심박수(bpm)
 * @property {number|null} resp_rate    호흡수(회/분)
 * @property {string|null} status       NORMAL | WARNING | ALERT | DANGER
 * @property {boolean}     presence     사람이 감지되는지
 * @property {boolean}     stabilizing  센서가 아직 안정화 중인지
 * @property {boolean}     saved        DB에 반영됐는지
 * @property {string}      measured_at  측정 시각(ISO 문자열)
 */

/**
 * 실시간 스트림을 연다.
 *
 * @param {object}   options
 * @param {"patient"|"department"} options.scope  환자 1명 / 우리 부서 전체
 * @param {number}  [options.patientId]           scope가 "patient"일 때 필수
 * @param {(payload: VitalPayload) => void} options.onVitals       값이 도착할 때마다 호출
 * @param {(connected: boolean) => void} [options.onConnectionChange] 연결 상태가 바뀔 때 호출
 * @returns {() => void} 연결을 닫는 함수 (화면이 사라질 때 반드시 호출)
 */
export function openVitalStream({ scope, patientId, onVitals, onConnectionChange }) {
  let closed = false;
  let source = null;
  let retryTimer = null;
  let attempt = 0;
  let connected = false;

  function setConnected(next) {
    if (connected === next) return;
    connected = next;
    onConnectionChange?.(next);
  }

  function scheduleRetry() {
    if (closed) return;
    // 실패가 쌓일수록 재시도 간격을 늘린다 (1초 → 2초 → 4초 … 최대 30초)
    const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
    attempt += 1;
    retryTimer = setTimeout(connect, delay);
  }

  function dropConnection() {
    if (source) {
      source.close();
      source = null;
    }
    setConnected(false);
  }

  async function connect() {
    if (closed) return;

    try {
      const { data } = await apiClient.post("/api/stream/ticket", {
        scope,
        patient_id: patientId ?? null,
      });
      if (closed) return;

      source = new EventSource(`${API}/api/stream/vitals?ticket=${encodeURIComponent(data.ticket)}`);

      source.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      source.addEventListener("vitals", (event) => {
        attempt = 0;
        setConnected(true);
        try {
          onVitals(JSON.parse(event.data));
        } catch {
          // 형식이 깨진 값 1건은 무시하고 계속 받는다
        }
      });

      source.onerror = () => {
        dropConnection();
        scheduleRetry();
      };
    } catch {
      // 티켓 발급 실패(로그인 만료, 서버 다운 등)
      dropConnection();
      scheduleRetry();
    }
  }

  connect();

  return function close() {
    closed = true;
    clearTimeout(retryTimer);
    dropConnection();
  };
}
