import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import { apiClient } from "../../api/client.js";
import { useVitalStream, pollInterval } from "../../api/use-vital-stream.js";
import { useMockTick } from "../../hooks/use-mock-tick.js";
import { isMockPatient, mockCurrent } from "../../lib/mock-vitals.js";
import { severityFromVitals } from "../../lib/vital-severity.js";
import { isVitalFresh } from "../../lib/vital-freshness.js";

const LEGEND = [
  { label: "응급", color: "#E0442E" },
  { label: "경고", color: "#E8762B" },
  { label: "주의", color: "#E8A13B" },
  { label: "정상", color: "#2FA35C" },
];

// 위험한 환자가 위로 오도록 정렬
const SEVERITY_ORDER = { emergency: 0, warning: 1, caution: 2, normal: 3, offline: 4 };

// 서버 등급(NEWS2 판정 결과) -> 화면 심각도. SSE 스트림은 대문자 enum 값을 그대로 보낸다.
const SEVERITY_BY_STATUS = {
  NORMAL: "normal",
  WARNING: "warning",
  ALERT: "caution",
  DANGER: "emergency",
};

function toMonitorCard(item) {
  const connected = item.device_status === "ACTIVE";
  const severity = SEVERITY_BY_STATUS[item.vital_status] ?? "normal";
  return {
    id: item.patient_id,
    name: item.name,
    ward: item.ward,
    room: item.room,
    // 센서가 끊기면 생체값 대신 '센서 확인 필요'를 보여준다
    severity: connected ? severity : "offline",
    onlineSeverity: severity,
    heartRate: item.heart_rate,
    respirationRate: item.resp_rate,
    measuredAt: item.measured_at,
    present: item.is_present,
    connected,
    battery: null, // 장치 배터리는 아직 서버가 내려주지 않는다
    earlyWarning: false,
  };
}

const CARD_STYLE = {
  emergency: { background: "#FDEDEA", borderColor: "#E0442E", borderWidth: 2 },
  offline: { background: "#EDF1F6", borderColor: "#DCE3EC", borderWidth: 1 },
};

function formatWardClock(date) {
  const datePart = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
  const timePart = date.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

/**
 * 실측 센서가 없는 환자에게 목업 값을 입힌다.
 * 대시보드·환자목록과 같은 생성기를 쓰므로 세 화면의 숫자가 항상 일치한다.
 * 센서가 끊긴(offline) 카드는 손대지 않는다 - 값 대신 "센서 확인 필요"를 보여야 한다.
 */
function withMockVitals(patient, tick) {
  // 센서가 끊긴 카드는 값 대신 "센서 확인 필요"를 보여야 하므로 손대지 않는다.
  if (patient.severity === "offline") return patient;

  if (!isMockPatient(patient.id)) {
    // 측정 중이 아니면 마지막 값을 현재값처럼 보여주지 않는다
    if (!isVitalFresh(patient.measuredAt)) {
      // 재실은 센서가 감지해야 아는 값이다
      return { ...patient, heartRate: null, respirationRate: null, severity: "offline", present: false };
    }
    // 실측 환자도 배지는 화면에 보이는 숫자에서 뽑는다.
    const severity =
      severityFromVitals(patient.heartRate, patient.respirationRate) ?? patient.severity;
    return { ...patient, severity, onlineSeverity: severity };
  }

  const heartRate = mockCurrent(patient.id, "heart", tick);
  const respirationRate = mockCurrent(patient.id, "resp", tick);
  const severity = severityFromVitals(heartRate, respirationRate);
  return { ...patient, heartRate, respirationRate, severity, onlineSeverity: severity };
}

function MonitorCard({ patient }) {
  const navigate = useNavigate();
  const style = CARD_STYLE[patient.severity] ?? { background: "#FFFFFF", borderColor: "#DCE3EC", borderWidth: 1 };
  const valueColor = patient.severity === "emergency" ? "#E0442E" : "#1E2A3A";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${patient.name} 상세 보기`}
      onClick={() => navigate(`/patients/${patient.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/patients/${patient.id}`);
        }
      }}
      className="flex cursor-pointer flex-col gap-[14px] rounded-xl p-4 shadow-[0_2px_3px_rgba(30,42,58,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(30,42,58,0.16)]"
      style={{ backgroundColor: style.background, borderColor: style.borderColor, borderWidth: style.borderWidth, borderStyle: "solid" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-[3px]">
          <p className={`text-base font-bold ${patient.severity === "offline" ? "text-[#5A6B80]" : "text-[#1E2A3A]"}`}>
            {patient.name}
          </p>
          <p className="text-xs text-[#5A6B80]">{patient.room}</p>
        </div>
        <StatusBadge severity={patient.severity} />
      </div>

      {patient.earlyWarning && patient.severity !== "offline" && (
        <div className="flex items-center gap-[5px] rounded-md bg-[#F1EEFC] px-[9px] py-1 text-[11px] font-bold text-[#6C4FD1]">
          <Icon name="activity" size={12} className="text-[#6C4FD1]" />
          이상 패턴 조기 감지 · 확인 권장
        </div>
      )}

      {patient.severity === "offline" ? (
        <div className="flex items-center justify-center gap-2 py-[18px]">
          <Icon name="wifi-off" size={20} className="text-[#5A6B80]" />
          <span className="text-sm font-bold text-[#5A6B80]">센서 확인 필요</span>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center gap-[5px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
              <Icon name="heart-pulse" size={13} />
              심박
            </div>
            <div className="flex items-end gap-[3px]">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: valueColor }}>
                {patient.heartRate ?? "--"}
              </span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">bpm</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center gap-[5px] text-[11px] font-bold tracking-wide text-[#5A6B80]">
              <Icon name="wind" size={13} />
              호흡
            </div>
            <div className="flex items-end gap-[3px]">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: valueColor }}>
                {patient.respirationRate ?? "--"}
              </span>
              <span className="pb-[2px] text-[11px] text-[#5A6B80]">회/분</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-[10px] border-t border-[#DCE3EC] pt-[10px]">
        <div className="flex items-center gap-[5px]">
          <Icon name={patient.connected ? "wifi" : "wifi-off"} size={13} className={patient.connected ? "text-[#2FA35C]" : "text-[#5A6B80]"} />
          <span className="text-[11px] text-[#5A6B80]">{patient.sensorStatus ?? (patient.connected ? "연결됨" : "연결 끊김")}</span>
        </div>
      </div>
    </div>
  );
}

function RealtimeMonitoring() {
  const [activeWard, setActiveWard] = useState("전체");
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  // 목업 값을 1초마다 갱신하기 위한 카운터
  const mockTick = useMockTick();
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 센서 값이 서버에 도착하는 즉시 해당 환자 카드만 갈아끼운다(새로고침 불필요)
  const realtime = useVitalStream({
    scope: "department",
    onVitals: (payload) => {
      setPatients((current) =>
        current.map((patient) =>
          patient.id !== payload.patient_id
            ? patient
            : {
                ...patient,
                // null이면 이번엔 갱신할 값이 없다는 뜻이라 직전 값을 유지한다
                heartRate: payload.heart_rate ?? patient.heartRate,
                respirationRate: payload.resp_rate ?? patient.respirationRate,
                measuredAt: payload.measured_at ?? patient.measuredAt,
                onlineSeverity: SEVERITY_BY_STATUS[payload.status] ?? patient.onlineSeverity,
                severity: patient.connected
                  ? (SEVERITY_BY_STATUS[payload.status] ?? patient.severity)
                  : "offline",
                present: payload.presence,
                earlyWarning: Boolean(payload.early_warning),
              },
        ),
      );
    },
  });

  // 환자 등록·센서 연결 상태처럼 스트림으로 오지 않는 값을 주기적으로 따라잡는다
  useEffect(() => {
    let cancelled = false;

    function load() {
      apiClient
        .get("/monitoring")
        .then(({ data }) => {
          if (cancelled) return;
          setError("");
          setWards(data.wards.map((item) => ({ name: item.ward, count: item.count })));
          setPatients(data.patients.map(toMonitorCard));
        })
        .catch(() => {
          if (!cancelled) setError("환자 목록을 불러오지 못했습니다.");
        });
    }

    load();
    const timer = setInterval(load, pollInterval(realtime));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [realtime]);

  // 목업 값을 여기서 한 번에 입힌다. 카드에서만 바꾸면 위험도 정렬과
  // 병동별 인원수가 예전 등급을 기준으로 계산돼 화면이 서로 어긋난다.
  const shownPatients = useMemo(
    () => patients.map((patient) => withMockVitals(patient, mockTick)),
    [patients, mockTick],
  );

  const wardTabs = useMemo(
    () => [{ name: "전체", count: shownPatients.length }, ...wards],
    [shownPatients, wards],
  );

  const visiblePatients = useMemo(
    () =>
      shownPatients
        .filter((patient) => activeWard === "전체" || patient.ward === activeWard)
        .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [shownPatients, activeWard],
  );

  return (
    <div className="realtime-monitoring flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="monitoring" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">실시간 모니터링{activeWard !== "전체" ? ` · ${activeWard}` : ""}</h1>
              <p className="text-[13px] text-[#5A6B80]">위험 환자 우선 정렬 · 자동 갱신</p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${realtime ? "bg-[#2FA35C]" : "bg-[#E8A13B]"}`} aria-hidden="true" />
                <span className="text-xs font-bold tracking-wide text-[#5A6B80]">
                  {realtime ? "실시간 연결됨" : "재연결 중"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-[14px] py-2">
                <Icon name="clock-3" size={15} className="text-[#5A6B80]" />
                <span className="text-[13px] font-semibold text-[#1E2A3A]">{formatWardClock(now)}</span>
              </div>

              <div className="flex items-center gap-4">
                {LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-[6px]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-[#5A6B80]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[#FDEDEA] px-3 py-2 text-xs font-semibold text-[#E0442E]">{error}</p>
          )}

          <div className="flex flex-wrap items-center gap-[10px]">
            {wardTabs.map((ward) => {
              const isActive = ward.name === activeWard;
              return (
                <button
                  key={ward.name}
                  type="button"
                  onClick={() => setActiveWard(ward.name)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-[10px] text-sm font-semibold ${
                    isActive ? "border-[#DCE3EC] bg-[#2B6FE3] text-white" : "border-[#DCE3EC] bg-white text-[#1E2A3A]"
                  }`}
                >
                  {ward.name}
                  <span
                    className={`rounded-full px-2 py-[2px] text-xs font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#EDF1F6] text-[#5A6B80]"
                    }`}
                  >
                    {ward.count}
                  </span>
                </button>
              );
            })}
          </div>

          {visiblePatients.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {visiblePatients.map((patient) => (
                <MonitorCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE3EC] bg-white p-10 text-center shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
              <p className="text-sm font-semibold text-[#5A6B80]">모니터링 중인 환자가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealtimeMonitoring;
