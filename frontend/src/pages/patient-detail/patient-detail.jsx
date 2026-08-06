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
import { composeSpecialNotes, parseSpecialNotes, splitForEditing } from "../../lib/special-notes.js";

const RANGE_OPTIONS = ["1시간", "6시간", "24시간"];
const RANGE_WINDOW_MS = { "1시간": 60 * 60 * 1000, "6시간": 6 * 60 * 60 * 1000, "24시간": 24 * 60 * 60 * 1000 };

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

function formatClock(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("ko-KR", { hour12: false });
}

function formatRelative(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return date.toLocaleDateString("ko-KR");
}

function buildRanges(logs, valueKey, defaultMin, defaultMax) {
  const now = Date.now();
  const ranges = {};
  for (const label of RANGE_OPTIONS) {
    const windowMs = RANGE_WINDOW_MS[label];
    const filtered = logs.filter((log) => now - new Date(log.recorded_at).getTime() <= windowMs);
    const values = filtered.length > 0 ? filtered.map((log) => log[valueKey]) : [defaultMin, defaultMax];
    const min = Math.min(defaultMin, ...values);
    const max = Math.max(defaultMax, ...values);
    ranges[label] = {
      xAxisLabels: filtered.length > 0 ? filtered.map((log) => formatClock(log.recorded_at)) : ["-"],
      data: values,
      min,
      max,
      markerIndex: filtered.length > 0 ? filtered.length - 1 : null,
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
        <div className="flex w-full flex-col gap-2">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
            {gridLines.map((y) => (
              <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#DCE3EC" strokeWidth="1" />
            ))}
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />
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
  const [alerts, setAlerts] = useState([]);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteKeys, setNoteKeys] = useState([]);
  const [noteOtherText, setNoteOtherText] = useState("");
  const [noteSaveError, setNoteSaveError] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      apiClient.get(`/patients/${patientId}`),
      apiClient.get(`/patients/${patientId}/vital-logs`),
      apiClient.get(`/patients/${patientId}/alerts`),
      apiClient.get(`/patients/${patientId}/emergency-logs`),
    ])
      .then(([detailRes, vitalLogsRes, alertsRes, emergencyLogsRes]) => {
        setDetail(detailRes.data);
        setVitalLogs(vitalLogsRes.data.vital_logs);
        setAlerts(alertsRes.data.alerts);
        setEmergencyLogs(emergencyLogsRes.data.emergency_logs);
      })
      .catch(() => {});
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

  const { patient, guardian, device_serial: deviceSerial, current_vital: currentVital } = detail;
  const age = calcAge(patient.birth_date);
  const severity = VITAL_STATUS_TO_SEVERITY[alerts[0]?.status] ?? "normal";
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

  const patientInfoRows = [
    ["환자명", patient.name, false],
    ["생년월일", age != null ? `${new Date(patient.birth_date).toLocaleDateString("ko-KR")} (${age}세)` : "-", false],
    ["성별", GENDER_LABEL[patient.gender] ?? patient.gender, false],
    ["병실·병상", `${patient.room_num}호 · ${patient.bed_num}번`, true],
    ["부착 장치", deviceSerial ?? "미등록", true],
  ];

  const timelineItems = alerts.map((alert) => ({
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
          <Link to="/patients" className="flex w-fit items-center gap-[6px] text-[#2B6FE3]">
            <Icon name="chevron-left" size={16} />
            <span className="text-sm font-semibold">환자 목록으로</span>
          </Link>

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

          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                  <span className="h-[3px] w-full bg-[#E8A13B]" />
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
                  <span className="h-[3px] w-full bg-[#2FA35C]" />
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
                subtitle="1분 평균 · vital_logs"
                yAxisLabels={[120, 100, 80, 60]}
                markerColor="#E8A13B"
                ranges={buildRanges(vitalLogs, "avg_heart_rate", 60, 120)}
              />

              <TrendChart
                title="호흡수 추이"
                subtitle="1분 평균 · vital_logs"
                yAxisLabels={[24, 18, 12, 6]}
                markerColor="#2FA35C"
                ranges={buildRanges(vitalLogs, "avg_resp_rate", 6, 24)}
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
                    <PresenceBadge label={patient.is_present ? "재실중" : "부재중"} />
                  </div>
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
                  <p className="text-base font-bold text-[#1E2A3A]">알림 타임라인</p>
                </div>
                <div className="flex flex-col">
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
                  <p className="text-base font-bold text-[#1E2A3A]">응급 이벤트</p>
                </div>
                <div className="flex flex-col">
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
