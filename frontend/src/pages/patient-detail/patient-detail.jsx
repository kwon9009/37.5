import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import PresenceBadge from "../../components/presence-badge/presence-badge.jsx";
import SpecialNoteTag from "../../components/special-note-tag/special-note-tag.jsx";
import SpecialNoteChips from "../../components/special-note-chips/special-note-chips.jsx";
import { apiClient } from "../../api/client.js";
import { useVitalStream, pollInterval } from "../../api/use-vital-stream.js";
import { composeSpecialNotes, parseSpecialNotes, splitForEditing } from "../../lib/special-notes.js";
import { formatRelative, formatTimeOnly } from "../../lib/datetime.js";
import { useMockTick } from "../../hooks/use-mock-tick.js";
import { isMockPatient, mockCurrent, mockSeries } from "../../lib/mock-vitals.js";
import { severityFromVitals } from "../../lib/vital-severity.js";
import { isVitalFresh } from "../../lib/vital-freshness.js";
import { toDisplayTime } from "../../lib/demo-time.js";
import { getErrorMessage } from "../../api/client.js";

const RANGE_OPTIONS = ["1시간", "6시간", "24시간"];
const RANGE_WINDOW_MS = { "1시간": 60 * 60 * 1000, "6시간": 6 * 60 * 60 * 1000, "24시간": 24 * 60 * 60 * 1000 };

// 생체값 카드 위의 색 띠. 예전에는 주황·초록이 고정이라 값이 없어도 주황 띠가
// 남아 경고처럼 보였다. 값에서 뽑은 등급을 따르고, 값이 없으면 회색으로 둔다.
const SEVERITY_BAR_COLOR = {
  normal: "#2FA35C",
  caution: "#E8A13B",
  warning: "#E8762B",
  emergency: "#E0442E",
  offline: "#DCE3EC",
};

function vitalBarColor(severity) {
  return SEVERITY_BAR_COLOR[severity] ?? SEVERITY_BAR_COLOR.offline;
}

const VITAL_STATUS_TO_SEVERITY = {
  NORMAL: "normal",
  WARNING: "warning",
  ALERT: "caution",
  DANGER: "emergency",
};

const GENDER_LABEL = { MALE: "남성", FEMALE: "여성" };

function calcAge(birthDateIso) {
  const birth = new Date(birthDateIso);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// 그래프 가로축은 촘촘해서 시각만 쓴다(날짜를 넣으면 라벨이 겹쳐 못 읽는다).
const formatClock = formatTimeOnly;

// 범위(1h/6h/24h)를 20등분한 구간별 평균으로 재집계한다.
// vital_logs는 1분 평균이라 24시간 범위면 최대 1440개 점이 나오는데,
// 그대로 찍으면 차트가 너무 빽빽해져서 구간 길이와 무관하게 20개 점으로 고정한다.
const CHART_BUCKET_COUNT = 20;

// 그래프에 쓸 실시간 표본 상한. 1초에 한 개씩 들어오므로 20분치다.
const LIVE_SAMPLE_LIMIT = 1200;

function bucketize(filtered, valueKey, windowMs, now) {
  const bucketMs = windowMs / CHART_BUCKET_COUNT;
  const windowStart = now - windowMs;
  const buckets = Array.from({ length: CHART_BUCKET_COUNT }, () => []);

  for (const log of filtered) {
    const time = new Date(log.recorded_at).getTime();
    const index = Math.min(CHART_BUCKET_COUNT - 1, Math.floor((time - windowStart) / bucketMs));
    if (index >= 0) buckets[index].push(log);
  }

  const points = [];
  buckets.forEach((bucketLogs, index) => {
    // 이 항목의 값이 있는 기록만 센다. 실시간 표본은 심박만 들어오고 호흡이
    // 비는 초가 있는데, null 을 0 으로 더하면 평균이 통째로 끌려 내려간다.
    const withValue = bucketLogs.filter((log) => log[valueKey] != null);
    if (withValue.length === 0) return;
    const avg = withValue.reduce((sum, log) => sum + log[valueKey], 0) / withValue.length;
    const lastLog = withValue[withValue.length - 1];
    points.push({ value: Math.round(avg * 10) / 10, label: formatClock(lastLog.recorded_at), bucketIndex: index });
  });
  return points;
}

function buildRanges(logs, valueKey, defaultMin, defaultMax) {
  const now = Date.now();
  // 시연 모드에서는 기록 시각을 늘려 짧은 측정도 하루치처럼 펼친다(평소엔 그대로).
  const shown = logs.map((log) => ({
    ...log,
    recorded_at: toDisplayTime(log.recorded_at, now).toISOString(),
  }));
  const ranges = {};
  for (const label of RANGE_OPTIONS) {
    const windowMs = RANGE_WINDOW_MS[label];
    const filtered = shown.filter((log) => now - new Date(log.recorded_at).getTime() <= windowMs);
    const points = bucketize(filtered, valueKey, windowMs, now);
    // 구간에 기록이 없으면 값을 지어내지 않는다. 예전에는 [최소, 최대]를 넣어
    // 60에서 120으로 쭉 올라가는 가짜 선이 그려졌다 - 없는 측정을 있는 것처럼 보였다.
    const values = points.map((point) => point.value);
    const min = values.length > 0 ? Math.min(defaultMin, ...values) : defaultMin;
    const max = values.length > 0 ? Math.max(defaultMax, ...values) : defaultMax;
    ranges[label] = {
      xAxisLabels: points.length > 0 ? points.map((point) => point.label) : ["-"],
      data: values,
      min,
      max,
      markerIndex: points.length > 0 ? points.length - 1 : null,
    };
  }
  return ranges;
}

// ── 시연용 목업 파형 ────────────────────────────────────────────────
// 실측 센서는 김철수(LIVE_PATIENT_ID)에게만 붙어 있다. 나머지 환자는
// vital_logs 가 비어 있어 그래프가 빈 칸으로 보이므로, 대시보드·환자목록과
// 똑같은 파형(lib/mock-vitals.js)을 여기서도 그린다.
// 값 생성기를 공유하므로 어느 화면에서 보든 같은 환자는 같은 값이 나온다.

// buildRanges 와 같은 모양의 결과를 만든다(화면 쪽은 실측/목업을 구분하지 않는다).
// tick 이 1 늘 때마다 파형이 한 칸씩 왼쪽으로 밀린다.
function buildMockRanges(patientId, kind, tick, defaultMin, defaultMax) {
  const now = Date.now();
  const values = mockSeries(patientId, kind, CHART_BUCKET_COUNT, tick);
  const ranges = {};
  for (const label of RANGE_OPTIONS) {
    const bucketMs = RANGE_WINDOW_MS[label] / CHART_BUCKET_COUNT;
    ranges[label] = {
      xAxisLabels: values.map((_, i) =>
        formatClock(new Date(now - (CHART_BUCKET_COUNT - 1 - i) * bucketMs).toISOString()),
      ),
      data: values,
      min: Math.min(defaultMin, ...values),
      max: Math.max(defaultMax, ...values),
      markerIndex: values.length - 1,
    };
  }
  return ranges;
}

function TrendChart({ title, subtitle, yAxisLabels, ranges, lineColor = "#2B6FE3", markerColor }) {
  const [range, setRange] = useState("6시간");
  const { xAxisLabels, data, min, max, markerIndex } = ranges[range];
  const width = 600;
  const height = 160;
  const step = width / (data.length - 1 || 1);
  const points = data.map((value, index) => [
    index * step,
    height - ((value - min) / (max - min || 1)) * height,
  ]);
  const linePath = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const gridLines = [0, height / 3, (height / 3) * 2, height];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-[3px]">
          <p className="text-base font-bold text-[#1E2A3A]">{title}</p>
          <p className="text-xs text-[#5A6B80]">{subtitle}</p>
        </div>
        <div className="flex gap-[6px]">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg border px-3 py-[6px] text-xs ${
                range === option ? "border-[#2B6FE3] font-bold text-[#2B6FE3]" : "border-[#DCE3EC] text-[#5A6B80]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-[#DCE3EC]" />
      <div className="flex gap-3 p-5">
        <div className="flex h-[160px] flex-col justify-between text-right text-[11px] text-[#5A6B80]">
          {yAxisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative flex w-full flex-col gap-2">
          {data.length === 0 && (
            <span className="absolute inset-x-0 top-[70px] text-center text-[13px] text-[#5A6B80]">
              이 구간에 측정 기록이 없습니다
            </span>
          )}
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
            {gridLines.map((y) => (
              <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#DCE3EC" strokeWidth="1" />
            ))}
            {/* 기록이 없으면 선을 그리지 않는다(없는 측정을 지어내지 않기 위해) */}
            {data.length > 0 && <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />}
            {markerIndex != null && (
              <circle
                cx={points[markerIndex][0]}
                cy={points[markerIndex][1]}
                r="4"
                fill={markerColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </svg>
          <div className="flex justify-between text-[11px] text-[#5A6B80]">
            {xAxisLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientDetail() {
  const { patientId } = useParams();
  const [detail, setDetail] = useState(null);
  const [vitalLogs, setVitalLogs] = useState([]);
  // 실측 센서가 붙은 환자만 진짜 그래프를 그린다. 나머지는 시연용 목업 파형.
  const useMock = isMockPatient(patientId);
  const mockTick = useMockTick(useMock);
  const [alerts, setAlerts] = useState([]);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteKeys, setNoteKeys] = useState([]);
  const [noteOtherText, setNoteOtherText] = useState("");
  const [noteSaveError, setNoteSaveError] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isConfirmingDischarge, setIsConfirmingDischarge] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);
  const [dischargeError, setDischargeError] = useState("");
  // 스트림으로 들어온 현재 생체값. 주기 조회 결과가 덮어쓰지 않도록 따로 들고 있는다.
  const [liveVital, setLiveVital] = useState(null);
  // 추이 그래프용 실시간 표본.
  // vital_logs 는 평균이라 30초에 한 행씩만 쌓여서, 측정을 시작해도 한동안
  // 그래프가 "기록 없음"으로 비어 있다. 숫자는 1초마다 바뀌는데 그래프만
  // 비어 있으면 고장난 것처럼 보이므로, 들어오는 값을 모아 함께 그린다.
  const [liveSamples, setLiveSamples] = useState([]);

  // 이 환자의 값이 서버에 도착하는 즉시 화면에 반영한다(새로고침 불필요)
  const realtime = useVitalStream({
    scope: "patient",
    patientId,
    onVitals: (payload) => {
      setLiveVital((previous) => ({
        // null이면 이번엔 갱신할 값이 없다는 뜻이라 직전 값을 유지한다
        heart_rate: payload.heart_rate ?? previous?.heart_rate ?? null,
        resp_rate: payload.resp_rate ?? previous?.resp_rate ?? null,
        status: payload.status ?? previous?.status ?? null,
        presence: payload.presence,
        measured_at: payload.measured_at,
        early_warning: Boolean(payload.early_warning),
      }));

      // 값이 실제로 들어온 초만 그래프 표본으로 쓴다(null 은 '이번엔 값 없음').
      if (payload.heart_rate != null || payload.resp_rate != null) {
        setLiveSamples((previous) =>
          [
            ...previous,
            {
              recorded_at: payload.measured_at ?? new Date().toISOString(),
              avg_heart_rate: payload.heart_rate,
              avg_resp_rate: payload.resp_rate,
            },
          ].slice(-LIVE_SAMPLE_LIMIT),
        );
      }
    },
  });

  // 환자를 옮기면 앞 환자의 표본이 남지 않도록 비운다
  useEffect(() => {
    setLiveSamples([]);
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    function load() {
      Promise.all([
        apiClient.get(`/patients/${patientId}`),
        apiClient.get(`/patients/${patientId}/vital-logs`),
        apiClient.get(`/patients/${patientId}/alerts`),
        apiClient.get(`/patients/${patientId}/emergency-logs`),
      ])
        .then(([detailRes, vitalLogsRes, alertsRes, emergencyLogsRes]) => {
          if (cancelled) return;
          setDetail(detailRes.data);
          setVitalLogs(vitalLogsRes.data.vital_logs);
          setAlerts(alertsRes.data.alerts);
          setEmergencyLogs(emergencyLogsRes.data.emergency_logs);
        })
        .catch(() => {});
    }

    load();
    // 이력·알림처럼 스트림으로 오지 않는 값만 주기적으로 따라잡는다
    const timer = setInterval(load, pollInterval(realtime));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [patientId, realtime]);

  // 화면이 바뀌면 이전 환자의 값이 잠깐 남지 않도록 비운다
  useEffect(() => {
    setLiveVital(null);
  }, [patientId]);

  if (!detail) {
    return (
      <div className="patient-detail flex min-h-screen bg-[#F5F7FA]">
        <Sidebar active="patients" />
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <div className="p-6 text-sm text-[#5A6B80]">불러오는 중...</div>
        </div>
      </div>
    );
  }

  const { patient, guardian, device_serial: deviceSerial, current_vital: storedVital } = detail;
  const age = calcAge(patient.birth_date);

  // 실시간으로 들어온 값이 있으면 그걸 우선 보여준다(주기 조회보다 항상 최신)
  // 목업 환자는 크게 뜨는 숫자도 그래프 맨 오른쪽 값과 같아야 한다.
  // 같은 tick 에서 뽑으므로 둘이 어긋나지 않는다.
  // 스트림 값과 저장 값을 "필드 단위로" 합친다.
  // liveVital ?? storedVital 로 두면, 안정화 중 스트림이 null 만 담긴 객체를
  // 보낼 때 그 객체가 저장 값을 통째로 가려서 상세만 "--" 로 뜬다
  // (목록·모니터링은 필드 단위로 유지하고 있어서 값이 보였다).
  const lastVital = {
    heart_rate: liveVital?.heart_rate ?? storedVital?.heart_rate ?? null,
    resp_rate: liveVital?.resp_rate ?? storedVital?.resp_rate ?? null,
    status: liveVital?.status ?? storedVital?.status ?? null,
    measured_at: liveVital?.measured_at ?? storedVital?.measured_at ?? null,
  };

  // 측정 중이 아니면 마지막 값을 현재값처럼 보여주지 않는다.
  // (실제로 이틀 전 값이 "현재 심박 74"로 떠 있었다)
  const realVital = isVitalFresh(lastVital.measured_at) ? lastVital : null;
  const currentVital = useMock
    ? {
        heart_rate: mockCurrent(patientId, "heart", mockTick),
        resp_rate: mockCurrent(patientId, "resp", mockTick),
        measured_at: new Date().toISOString(),
      }
    : realVital;

  // 상태 배지도 실시간 판정 결과를 따라간다.
  // 스트림이 없을 때만 기존처럼 최근 알림 기준으로 보여준다.
  // 목업 환자는 배지도 화면에 보이는 숫자에서 뽑는다(숫자와 배지가 어긋나지 않게).
  // 등급은 "화면에 보이는 숫자"에서 뽑는다.
  //
  // 지금 재고 있는 값이 없으면 등급을 매기지 않고 '센서없음'으로 둔다.
  // 예전에는 alerts[0].status 로 물러났는데, 그러면 측정을 안 하는 환자에게
  // 2주 전 알림 등급이 그대로 붙어 "부재중인데 응급"으로 보였다.
  const severity =
    severityFromVitals(currentVital?.heart_rate, currentVital?.resp_rate) ?? "offline";
  // 저장된 평균(vital_logs)과 지금 들어오는 값을 합쳐 그린다.
  // 평균은 과거 구간을, 실시간 표본은 방금 몇 분을 채운다.
  const trendLogs = liveSamples.length > 0 ? [...vitalLogs, ...liveSamples] : vitalLogs;

  // 재실은 센서가 감지해야 아는 값이라, 측정이 멈추면 재실로 둘 수 없다
  const isPresentNow = realVital != null && (liveVital?.presence ?? patient.is_present);

  const specialNoteTags = parseSpecialNotes(patient.special_notes);

  const openNotesEditor = () => {
    const { selectedKeys, otherText } = splitForEditing(patient.special_notes);
    setNoteKeys(selectedKeys);
    setNoteOtherText(otherText);
    setNoteSaveError("");
    setIsEditingNotes(true);
  };

  const toggleNoteKey = (key) => {
    setNoteKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const markAlertRead = (alertId) => {
    apiClient.patch(`/alerts/${alertId}/read`).then(() => {
      setAlerts((current) =>
        current.map((alert) => (alert.alert_id === alertId ? { ...alert, is_read: true } : alert)),
      );
    });
  };

  const saveNotes = async () => {
    const composed = composeSpecialNotes(noteKeys, noteOtherText);
    setIsSavingNotes(true);
    setNoteSaveError("");
    try {
      await apiClient.patch(`/patients/${patientId}/special-notes`, { special_notes: composed });
      setDetail((current) => ({ ...current, patient: { ...current.patient, special_notes: composed } }));
      setIsEditingNotes(false);
    } catch {
      setNoteSaveError("특이사항 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const confirmDischarge = async () => {
    setIsDischarging(true);
    setDischargeError("");
    try {
      await apiClient.patch(`/patients/${patientId}/discharge`);
      setDetail((current) => ({
        ...current,
        patient: { ...current.patient, status: "DISCHARGED", is_present: false },
      }));
      setIsConfirmingDischarge(false);
    } catch (err) {
      setDischargeError(getErrorMessage(err, "퇴원 처리에 실패했습니다. 다시 시도해 주세요."));
    } finally {
      setIsDischarging(false);
    }
  };

  const patientInfoRows = [
    ["환자명", patient.name, false],
    ["생년월일", age != null ? `${new Date(patient.birth_date).toLocaleDateString("ko-KR")} (${age}세)` : "-", false],
    ["성별", GENDER_LABEL[patient.gender] ?? patient.gender, false],
    ["병실·병상", `${patient.room_num}호 · ${patient.bed_num}번`, true],
    ["부착 장치", deviceSerial ?? "미등록", true],
  ];

  // 최신 알림이 위로 오도록 정렬한다. 목록이 길 때 오래된 것부터 보이면
  // 방금 무슨 일이 있었는지 확인하려고 끝까지 내려야 한다.
  const timelineItems = [...alerts]
    .sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1))
    .map((alert) => ({
      key: alert.alert_id,
      icon: "activity",
      message: alert.message,
      time: formatRelative(alert.sent_at),
      severity: VITAL_STATUS_TO_SEVERITY[alert.status] ?? "normal",
      isRead: alert.is_read,
    }));

  const emergencyEvents = emergencyLogs.map((log, index) => ({
    key: `${log.created_at}-${index}`,
    icon: "triangle-alert",
    message: log.event_type,
    meta: `${new Date(log.created_at).toLocaleString("ko-KR", { hour12: false })} · 심박 ${log.heart_rate}bpm · 호흡 ${log.resp_rate}회/분`,
  }));

  return (
    <div className="patient-detail flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="patients" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to="/patients" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
              <Icon name="chevron-left" size={16} />
              <span className="text-sm font-semibold">환자 목록으로</span>
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${realtime ? "bg-[#2FA35C]" : "bg-[#E8A13B]"}`}
                aria-hidden="true"
              />
              <span className="text-xs font-bold tracking-wide text-[#5A6B80]">
                {realtime ? "실시간 연결됨" : "재연결 중"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 shrink-0 rounded-full border border-[#DCE3EC] bg-[#EDF1F6]" />
              <div className="flex flex-col gap-[5px]">
                <p className="text-2xl font-bold text-[#1E2A3A]">{patient.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5A6B80]">
                  <span>{patient.room_num}호 · {patient.bed_num}번</span>
                  <span>{GENDER_LABEL[patient.gender] ?? patient.gender}{age != null ? ` · ${age}세` : ""}</span>
                  <span>{patient.department}</span>
                </div>
                {specialNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {specialNoteTags.map((tag, index) => (
                      <span
                        key={`${tag.label}-${index}`}
                        className="rounded-full px-[10px] py-1 text-[11px] font-semibold"
                        style={
                          tag.critical
                            ? { backgroundColor: "#FDEDEA", color: "#E0442E" }
                            : { backgroundColor: "#EDF1F6", color: "#5A6B80" }
                        }
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <StatusBadge severity={severity} size="lg" />
          </div>

          {liveVital?.early_warning && (
            <div className="flex items-center gap-[6px] rounded-lg bg-[#F1EEFC] px-4 py-[10px] text-[13px] font-bold text-[#6C4FD1]">
              <Icon name="activity" size={15} className="text-[#6C4FD1]" />
              이상 패턴 조기 감지 · 평소 패턴과 다른 변화가 감지되었습니다. 확인을 권장합니다.
            </div>
          )}

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span
                    className="h-[3px] w-full"
                    style={{ backgroundColor: vitalBarColor(severityFromVitals(currentVital?.heart_rate, null) ?? "offline") }}
                  />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="heart-pulse" size={15} />
                      현재 심박
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">
                        {currentVital?.heart_rate ?? "--"}
                      </span>
                      <span className="pb-1 text-base text-[#5A6B80]">bpm</span>
                    </div>
                    <p className="text-[13px] text-[#5A6B80]">
                      {currentVital?.measured_at ? `${formatRelative(currentVital.measured_at)} 측정` : "측정 기록 없음"}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span
                    className="h-[3px] w-full"
                    style={{ backgroundColor: vitalBarColor(severityFromVitals(null, currentVital?.resp_rate) ?? "offline") }}
                  />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-[7px] text-xs font-bold tracking-wide text-[#5A6B80]">
                      <Icon name="wind" size={15} />
                      현재 호흡
                    </div>
                    <div className="flex items-end gap-[6px]">
                      <span className="text-[48px] font-extrabold leading-none text-[#1E2A3A]">
                        {currentVital?.resp_rate ?? "--"}
                      </span>
                      <span className="pb-1 text-base text-[#5A6B80]">회/분</span>
                    </div>
                    <p className="text-[13px] text-[#5A6B80]">
                      {currentVital?.measured_at ? `${formatRelative(currentVital.measured_at)} 측정` : "측정 기록 없음"}
                    </p>
                  </div>
                </div>
              </div>

              <TrendChart
                title="심박수 추이"
                subtitle={useMock ? "1분 평균" : liveSamples.length > 0 ? "실시간 측정 · 1분 평균" : "1분 평균 · vital_logs"}
                yAxisLabels={[120, 100, 80, 60]}
                markerColor="#E8A13B"
                ranges={
                  useMock
                    ? buildMockRanges(patientId, "heart", mockTick, 60, 120)
                    : buildRanges(trendLogs, "avg_heart_rate", 60, 120)
                }
              />

              <TrendChart
                title="호흡수 추이"
                subtitle={useMock ? "1분 평균" : liveSamples.length > 0 ? "실시간 측정 · 1분 평균" : "1분 평균 · vital_logs"}
                yAxisLabels={[24, 18, 12, 6]}
                markerColor="#2FA35C"
                ranges={
                  useMock
                    ? buildMockRanges(patientId, "resp", mockTick, 6, 24)
                    : buildRanges(trendLogs, "avg_resp_rate", 6, 24)
                }
              />
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[380px] xl:shrink-0">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">환자 정보</p>
                </div>
                <div className="flex flex-col gap-[10px] p-[17px]">
                  {patientInfoRows.map(([label, value, mono]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">{label}</span>
                      <span className={`text-[13px] font-semibold text-[#1E2A3A] ${mono ? "font-mono" : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">재실 여부</span>
                    <PresenceBadge label={isPresentNow ? "재실중" : "부재중"} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">입퇴원 상태</span>
                    {patient.status === "DISCHARGED" ? (
                      <span className="text-[13px] font-semibold text-[#5A6B80]">퇴원 완료</span>
                    ) : !isConfirmingDischarge ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDischargeError("");
                          setIsConfirmingDischarge(true);
                        }}
                        className="text-[12px] font-bold text-[#E0442E]"
                      >
                        퇴원 처리
                      </button>
                    ) : (
                      <div className="flex items-center gap-[6px]">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDischarge(false)}
                          disabled={isDischarging}
                          className="rounded-md border border-[#DCE3EC] bg-white px-[10px] py-1 text-[12px] font-semibold text-[#1E2A3A]"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={confirmDischarge}
                          disabled={isDischarging}
                          className="rounded-md bg-[#E0442E] px-[10px] py-1 text-[12px] font-bold text-white disabled:opacity-60"
                        >
                          {isDischarging ? "처리 중..." : "정말 퇴원 처리"}
                        </button>
                      </div>
                    )}
                  </div>
                  {dischargeError && <p className="text-[12px] font-semibold text-[#E0442E]">{dischargeError}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">담당 병원</span>
                    <span className="text-[13px] font-semibold text-[#1E2A3A]">{patient.hospital}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5A6B80]">특이사항</span>
                    {!isEditingNotes && (
                      <button
                        type="button"
                        onClick={openNotesEditor}
                        className="flex items-center gap-1 text-[12px] font-bold text-[#2B6FE3]"
                      >
                        <Icon name="pencil" size={12} />
                        수정
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="flex flex-col gap-2">
                      <SpecialNoteChips selectedKeys={noteKeys} onToggle={toggleNoteKey} />
                      <input
                        type="text"
                        value={noteOtherText}
                        onChange={(event) => setNoteOtherText(event.target.value)}
                        placeholder="위 항목에 없는 내용은 직접 입력하세요"
                        className="h-10 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-[13px] text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                      />
                      {noteSaveError && <p className="text-[12px] font-semibold text-[#E0442E]">{noteSaveError}</p>}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingNotes(false)}
                          disabled={isSavingNotes}
                          className="rounded-lg border border-[#DCE3EC] bg-white px-4 py-[8px] text-[13px] font-semibold text-[#1E2A3A]"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={saveNotes}
                          disabled={isSavingNotes}
                          className="rounded-lg bg-[#2B6FE3] px-4 py-[8px] text-[13px] font-bold text-white disabled:opacity-60"
                        >
                          {isSavingNotes ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : specialNoteTags.length > 0 ? (
                    <div className="flex flex-wrap gap-[6px]">
                      {specialNoteTags.map((tag, index) => (
                        <SpecialNoteTag
                          key={`${tag.label}-${index}`}
                          icon={tag.icon}
                          color={tag.critical ? "#E0442E" : "#5A6B80"}
                          label={tag.label}
                          showLabel
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#5A6B80]">등록된 특이사항이 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">보호자</p>
                </div>
                {guardian ? (
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCE3EC] bg-[#EDF1F6] text-base font-bold text-[#1E2A3A]">
                        {guardian.name.slice(0, 1)}
                      </span>
                      <div className="flex flex-col gap-[3px]">
                        <p className="text-[15px] font-bold text-[#1E2A3A]">{guardian.name}</p>
                        <p className="text-xs text-[#5A6B80]">보호자</p>
                      </div>
                    </div>
                    <div className="h-px bg-[#DCE3EC]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#5A6B80]">연락처</span>
                      <span className="font-mono text-[13px] font-semibold text-[#1E2A3A]">{guardian.phone}</span>
                    </div>
                    <a
                      href={`tel:${guardian.phone}`}
                      className="flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#2B6FE3] text-sm font-bold text-white"
                    >
                      <Icon name="phone" size={16} className="text-white" />
                      보호자에게 전화
                    </a>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-[#5A6B80]">등록된 보호자가 없습니다.</p>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-[#1E2A3A]">알림 타임라인</p>
                    {timelineItems.length > 0 && (
                      <span className="rounded-full bg-[#EDF1F6] px-[10px] py-[3px] text-xs font-bold text-[#5A6B80]">
                        {timelineItems.length}건
                      </span>
                    )}
                  </div>
                </div>
                {/* 알림이 수십 건 쌓이면 화면이 끝없이 길어져 아래 카드가 묻힌다.
                    높이를 묶어 목록 안에서만 스크롤되게 한다. */}
                <div className="flex max-h-[320px] flex-col overflow-y-auto">
                  {timelineItems.length === 0 && (
                    <p className="px-5 py-4 text-sm text-[#5A6B80]">알림 기록이 없습니다.</p>
                  )}
                  {timelineItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 border-b border-[#DCE3EC] px-5 py-[14px] last:border-b-0"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCF0DC]">
                        <Icon name={item.icon} size={16} style={{ color: "#E8A13B" }} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">{item.message}</p>
                        <p className="text-[11px] text-[#5A6B80]">{item.time}</p>
                      </div>
                      <StatusBadge severity={item.severity} />
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => markAlertRead(item.key)}
                          className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#2B6FE3] px-[10px] text-[11px] font-bold text-white"
                        >
                          <Icon name="check" size={12} className="text-white" />
                          읽음
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-[#1E2A3A]">응급 이벤트</p>
                    {emergencyEvents.length > 0 && (
                      <span className="rounded-full bg-[#EDF1F6] px-[10px] py-[3px] text-xs font-bold text-[#5A6B80]">
                        {emergencyEvents.length}건
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex max-h-[320px] flex-col overflow-y-auto">
                  {emergencyEvents.length === 0 && (
                    <p className="px-5 py-4 text-sm text-[#5A6B80]">응급 이벤트 기록이 없습니다.</p>
                  )}
                  {emergencyEvents.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 border-b border-[#DCE3EC] px-5 py-[14px] last:border-b-0"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDEDEA]">
                        <Icon name={item.icon} size={16} style={{ color: "#E0442E" }} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">{item.message}</p>
                        <p className="truncate text-[11px] text-[#5A6B80]">{item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetail;
