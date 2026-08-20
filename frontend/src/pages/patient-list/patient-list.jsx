import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";
import PresenceBadge from "../../components/presence-badge/presence-badge.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import PatientRegisterModal from "../../components/modals/patient-register-modal/patient-register-modal.jsx";
import { apiClient } from "../../api/client.js";
import { useVitalStream, pollInterval } from "../../api/use-vital-stream.js";
import { useMockTick } from "../../hooks/use-mock-tick.js";
import { isMockPatient, mockCurrent } from "../../lib/mock-vitals.js";
import { severityFromVitals } from "../../lib/vital-severity.js";
import { isVitalFresh } from "../../lib/vital-freshness.js";

const SEVERITY_CHIPS = [
  { key: "normal", label: "정상", color: "#2FA35C" },
  { key: "caution", label: "주의", color: "#E8A13B" },
  { key: "warning", label: "경고", color: "#E8762B" },
  { key: "emergency", label: "응급", color: "#E0442E" },
];

const VITAL_STATUS_TO_SEVERITY = {
  NORMAL: "normal",
  WARNING: "warning",
  ALERT: "caution",
  DANGER: "emergency",
};

const GENDER_LABEL = { MALE: "남", FEMALE: "여" };

const PRESENT = { label: "재실중", color: "#2FA35C" };
const ABSENT = { label: "부재중", color: "#5A6B80" };
const DISCHARGED = { label: "퇴원", color: "#5A6B80" };

function toClock(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleTimeString("ko-KR", { hour12: false });
}

function toPatientRow(item) {
  const room = `${item.room_num}호`;
  return {
    id: item.patient_id,
    name: item.name,
    gender: GENDER_LABEL[item.gender] ?? item.gender,
    birthDate: item.birthdate,
    room,
    discharged: item.patient_status === "DISCHARGED",
    presence: item.patient_status === "DISCHARGED" ? DISCHARGED : PRESENT,
    severity: VITAL_STATUS_TO_SEVERITY[item.vital_status] ?? "normal",
    heartRate: item.heart_rate ?? "--",
    respirationRate: item.resp_rate ?? "--",
    nurse: item.department_name,
    lastUpdate: item.updated_at ? toClock(item.updated_at) : "-",
    // 신선도 판단용 원본 시각
    measuredAt: item.updated_at,
  };
}

function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  // 목업 환자의 심박·호흡을 1초마다 갱신하기 위한 카운터
  const mockTick = useMockTick();
  const [query, setQuery] = useState("");
  const [activeSeverities, setActiveSeverities] = useState([]);
  const [roomTab, setRoomTab] = useState("전체");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // 센서 값이 서버에 도착하는 즉시 해당 환자 줄만 갈아끼운다(새로고침 불필요)
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
                severity: VITAL_STATUS_TO_SEVERITY[payload.status] ?? patient.severity,
                presence: patient.discharged ? DISCHARGED : payload.presence ? PRESENT : ABSENT,
                lastUpdate: toClock(payload.measured_at),
                measuredAt: payload.measured_at,
              },
        ),
      );
    },
  });

  // 스트림으로 오지 않는 것(환자 등록/퇴원 등)을 따라잡기 위한 주기 갱신.
  // 스트림이 끊기면 이 주기가 빨라져 폴링만으로도 화면이 돈다.
  useEffect(() => {
    let cancelled = false;

    function load() {
      apiClient
        .get("/patients")
        .then(({ data }) => {
          if (!cancelled) setPatients(data.patients.map(toPatientRow));
        })
        .catch(() => {});
    }

    load();
    const timer = setInterval(load, pollInterval(realtime));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [realtime]);

  const roomTabs = useMemo(() => ["전체", ...Array.from(new Set(patients.map((patient) => patient.room)))], [patients]);

  const toggleSeverity = (key) => {
    setActiveSeverities((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const handleRegisterPatient = (form) => {
    const room = form.room.trim() || "미배정";
    setPatients((current) => [
      {
        id: `${form.name}-${Date.now()}`,
        name: form.name,
        gender: form.gender,
        birthDate: form.birthDate || "-",
        room,
        discharged: false,
        presence: PRESENT,
        severity: "normal",
        heartRate: "--",
        respirationRate: "--",
        nurse: "-",
        lastUpdate: toClock(new Date()),
        specialNotes: form.special_notes || "",
      },
      ...current,
    ]);
  };

  // 목업 값을 여기서 한 번에 입힌다. 표시할 때만 바꾸면 등급 필터가
  // 서버가 준 옛 등급으로 걸러서 "정상인데 경고 필터에 잡히는" 일이 생긴다.
  const shownPatients = useMemo(
    () =>
      patients.map((patient) => {
        if (!isMockPatient(patient.id)) {
          // 측정 중이 아니면 마지막 값을 현재값처럼 보여주지 않는다
          if (!isVitalFresh(patient.measuredAt)) {
            // 재실은 센서가 감지해야 아는 값이라, 측정이 멈추면 재실로 둘 수 없다
            return {
              ...patient,
              heartRate: "--",
              respirationRate: "--",
              severity: "offline",
              presence: patient.presence === DISCHARGED ? DISCHARGED : ABSENT,
            };
          }
          return {
            ...patient,
            severity:
              severityFromVitals(patient.heartRate, patient.respirationRate) ?? patient.severity,
          };
        }
        const heartRate = mockCurrent(patient.id, "heart", mockTick);
        const respirationRate = mockCurrent(patient.id, "resp", mockTick);
        return {
          ...patient,
          heartRate,
          respirationRate,
          severity: severityFromVitals(heartRate, respirationRate),
        };
      }),
    [patients, mockTick],
  );

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim();
    return shownPatients.filter((patient) => {
      const matchesRoom = roomTab === "전체" || patient.room === roomTab;
      const matchesSeverity = activeSeverities.length === 0 || activeSeverities.includes(patient.severity);
      const matchesQuery =
        normalizedQuery === "" || patient.name.includes(normalizedQuery) || patient.room.includes(normalizedQuery);
      return matchesRoom && matchesSeverity && matchesQuery;
    });
  }, [shownPatients, query, activeSeverities, roomTab]);

  return (
    <div className="patient-list flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active="patients" />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-[#1E2A3A]">환자 목록</h1>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${realtime ? "bg-[#2FA35C]" : "bg-[#E8A13B]"}`}
                aria-hidden="true"
              />
              <p className="text-sm text-[#5A6B80]">
                총 {patients.length}명 모니터링 중 · {realtime ? "실시간 연결됨" : "재연결 중"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-[280px] items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-[14px]">
                <Icon name="search" size={16} className="shrink-0 text-[#5A6B80]" />
                <input
                  type="text"
                  placeholder="환자 이름 또는 병실 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {SEVERITY_CHIPS.map((chip) => {
                  const isActive = activeSeverities.includes(chip.key);
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => toggleSeverity(chip.key)}
                      className="flex h-8 items-center gap-[6px] rounded-full border px-3 text-xs font-bold tracking-wide"
                      style={
                        isActive
                          ? { backgroundColor: chip.color, borderColor: chip.color, color: "#FFFFFF" }
                          : { backgroundColor: "#FFFFFF", borderColor: "#DCE3EC", color: "#1E2A3A" }
                      }
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: isActive ? "#FFFFFF" : chip.color }}
                      />
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-[2px] rounded-lg border border-[#DCE3EC] bg-white p-[2px]">
                {roomTabs.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setRoomTab(room)}
                    className={`rounded-md px-3 py-[6px] text-xs font-semibold ${
                      roomTab === room ? "bg-[#2B6FE3] text-white" : "text-[#5A6B80]"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-[6px] rounded-lg bg-[#2B6FE3] px-4 py-[10px] text-sm font-bold text-white"
              >
                <Icon name="user-check" size={16} className="text-white" />
                환자 등록
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[6%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[11%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="h-12 bg-[#EDF1F6]">
                  {["환자", "성별", "생년월일", "병실", "재실", "상태", "심박", "호흡", "담당", "상세"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="h-14 border-t border-[#DCE3EC]">
                    <td className="px-4 text-[15px] font-semibold text-[#1E2A3A]">{patient.name}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{patient.gender}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{patient.birthDate}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{patient.room}</td>
                    <td className="px-4">
                      <PresenceBadge label={patient.presence.label} color={patient.presence.color} />
                    </td>
                    <td className="px-4">
                      <StatusBadge severity={patient.severity} />
                    </td>
                    <td className="px-4 text-[15px] font-bold text-[#1E2A3A]">{patient.heartRate}</td>
                    <td className="px-4 text-[15px] font-bold text-[#1E2A3A]">{patient.respirationRate}</td>
                    <td className="px-4 text-[15px] text-[#1E2A3A]">{patient.nurse}</td>
                    <td className="px-4">
                      <button
                        type="button"
                        aria-label={`${patient.name} 상세 보기`}
                        onClick={() => navigate(`/patients/${encodeURIComponent(patient.id)}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B6FE3]"
                      >
                        <Icon name="chevron-right" size={16} className="text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#5A6B80]">
                      조건에 맞는 환자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      <PatientRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleRegisterPatient}
      />
    </div>
  );
}

export default PatientList;
