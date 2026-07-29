import { useState } from "react";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";

const SEVERITY_ROWS = [
  { key: "caution", label: "주의", color: "#E8A13B" },
  { key: "warning", label: "경고", color: "#E8762B" },
  { key: "emergency", label: "응급", color: "#E0442E" },
];

const INITIAL_THRESHOLDS = {
  heartRate: {
    unit: "bpm",
    icon: "heart-pulse",
    title: "심박 임계값 · BPM",
    values: {
      caution: { low: 55, high: 110 },
      warning: { low: 50, high: 120 },
      emergency: { low: 45, high: 140 },
    },
  },
  respiration: {
    unit: "회/분",
    icon: "wind",
    title: "호흡 임계값 · 회/분",
    values: {
      caution: { low: 10, high: 24 },
      warning: { low: 8, high: 28 },
      emergency: { low: 6, high: 32 },
    },
  },
};

const INITIAL_RULES = [
  { id: 1, name: "응급 즉시 알림", trigger: "응급 상태 진입", delay: "0초", recipient: "병원 + 보호자", channel: "앱 · SMS · 전화", active: true },
  { id: 2, name: "경고 지속 알림", trigger: "경고 상태 3분 지속", delay: "3분", recipient: "병원", channel: "앱 · SMS", active: true },
  { id: 3, name: "주의 관찰 알림", trigger: "주의 상태 10분 지속", delay: "10분", recipient: "병원", channel: "앱", active: true },
  { id: 4, name: "센서 연결 끊김", trigger: "센서 5분 이상 끊김", delay: "5분", recipient: "병원", channel: "앱", active: true },
  { id: 5, name: "배터리 부족", trigger: "배터리 20% 이하", delay: "—", recipient: "병원", channel: "앱", active: false },
];

function ThresholdCard({ metric, onChangeValue }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex items-center gap-2 border-b border-[#DCE3EC] bg-[#EDF1F6] px-5 py-[14px]">
        <Icon name={metric.icon} size={16} className="text-[#5A6B80]" />
        <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{metric.title}</p>
      </div>
      <div className="flex flex-col px-5">
        {SEVERITY_ROWS.map((row, index) => (
          <div
            key={row.key}
            className={`flex flex-wrap items-center justify-between gap-3 py-4 ${index < SEVERITY_ROWS.length - 1 ? "border-b border-[#DCE3EC]" : ""}`}
          >
            <div className="flex w-[90px] items-center gap-2">
              <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: row.color }} />
              <span className="text-sm font-bold text-[#1E2A3A]">{row.label}</span>
            </div>
            <div className="flex gap-4">
              {["low", "high"].map((field) => (
                <div key={field} className="flex flex-col items-end gap-[5px]">
                  <span className="text-[11px] text-[#5A6B80]">{field === "low" ? "하한" : "상한"}</span>
                  <div className="flex w-[104px] items-center justify-between rounded-lg border border-[#DCE3EC] px-3 py-[9px]">
                    <input
                      type="number"
                      value={metric.values[row.key][field]}
                      onChange={(event) => onChangeValue(row.key, field, event.target.value)}
                      className="w-12 border-0 bg-transparent text-[15px] font-bold text-[#1E2A3A] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#5A6B80]">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminNotificationManagement() {
  const [thresholds, setThresholds] = useState(INITIAL_THRESHOLDS);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleChangeValue = (metricKey, severityKey, field, value) => {
    setThresholds((current) => ({
      ...current,
      [metricKey]: {
        ...current[metricKey],
        values: {
          ...current[metricKey].values,
          [severityKey]: { ...current[metricKey].values[severityKey], [field]: Number(value) },
        },
      },
    }));
  };

  const handleToggleRule = (id) => {
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)));
  };

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="admin-notification-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="notifications" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader notificationCount={5} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">알림 관리</h1>
              <p className="text-sm text-[#5A6B80]">생체신호 임계값 및 알림 규칙 설정</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white"
            >
              <Icon name="check" size={16} className="text-white" />
              {savedFlash ? "저장됨" : "변경사항 저장"}
            </button>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <ThresholdCard
              metric={thresholds.heartRate}
              onChangeValue={(sev, field, value) => handleChangeValue("heartRate", sev, field, value)}
            />
            <ThresholdCard
              metric={thresholds.respiration}
              onChangeValue={(sev, field, value) => handleChangeValue("respiration", sev, field, value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name="bell-ring" size={15} className="text-[#5A6B80]" />
              <p className="text-xs font-bold tracking-wide text-[#5A6B80]">알림 규칙 · ALERT RULES</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[19%]" />
                  <col className="w-[24%]" />
                  <col className="w-[9%]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="h-12 bg-[#EDF1F6]">
                    {["규칙명", "트리거 조건", "지연", "수신 대상", "알림 채널", "상태"].map((heading) => (
                      <th key={heading} scope="col" className="px-4 text-xs font-bold tracking-wide text-[#5A6B80]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="h-14 border-t border-[#DCE3EC]">
                      <td className="px-4 text-sm font-semibold text-[#1E2A3A]">{rule.name}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{rule.trigger}</td>
                      <td className="px-4 text-sm text-[#1E2A3A]">{rule.delay}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{rule.recipient}</td>
                      <td className="px-4 text-sm text-[#5A6B80]">{rule.channel}</td>
                      <td className="px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className="flex items-center gap-[6px] rounded-full bg-[#EDF1F6] px-[10px] py-[5px]"
                        >
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{ backgroundColor: rule.active ? "#2FA35C" : "#9AA7B6" }}
                          />
                          <span className={`text-xs font-bold ${rule.active ? "text-[#1E2A3A]" : "text-[#5A6B80]"}`}>
                            {rule.active ? "활성" : "비활성"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNotificationManagement;
