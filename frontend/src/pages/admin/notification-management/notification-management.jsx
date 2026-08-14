import { useEffect, useState } from "react";
import AdminSidebar from "../../../components/admin-sidebar/admin-sidebar.jsx";
import AdminHeader from "../../../components/admin-header/admin-header.jsx";
import Icon from "../../../components/icon/icon.jsx";
import { apiClient, getErrorMessage } from "../../../api/client.js";

// backend/app/services/vital_service.py의 NEWS2 점수표를 그대로 옮긴 값.
// 영국 왕립의사회 NEWS2 임상 표준 기준이라 관리자가 바꿀 수 있는 값이 아니다(참고용).
// 응급(DANGER) 경계만 예외 - 그 값은 아래 "시스템 설정" 카드에서 실제 설정값으로 보여준다.
const NEWS2_REFERENCE = [
  {
    icon: "heart-pulse",
    title: "심박 · BPM",
    rows: [
      { label: "정상", range: "51 ~ 90" },
      { label: "주의 (+1점)", range: "41~50 또는 91~110" },
      { label: "경고 (+2점)", range: "111 ~ 130" },
    ],
  },
  {
    icon: "wind",
    title: "호흡 · 회/분",
    rows: [
      { label: "정상", range: "12 ~ 20" },
      { label: "주의 (+1점)", range: "9~11" },
      { label: "경고 (+2점)", range: "21 ~ 24" },
    ],
  },
];

// 백엔드 검증 범위(app/schemas/admin/system_settings_update_request.py)와 동일.
// NEWS2 기본값 근처로만 조정을 허용해서, 임상적으로 말이 안 되는 값을 막는다.
const DANGER_BOUND_LIMITS = {
  heart_rate_danger_low: [30, 50],
  heart_rate_danger_high: [121, 141],
  resp_rate_danger_low: [3, 13],
  resp_rate_danger_high: [20, 30],
};

function News2Card({ metric }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex items-center gap-2 border-b border-[#DCE3EC] bg-[#EDF1F6] px-5 py-[14px]">
        <Icon name={metric.icon} size={16} className="text-[#5A6B80]" />
        <p className="text-xs font-bold tracking-wide text-[#5A6B80]">{metric.title}</p>
      </div>
      <div className="flex flex-col px-5">
        {metric.rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-3 py-3 ${index < metric.rows.length - 1 ? "border-b border-[#DCE3EC]" : ""}`}
          >
            <span className="text-sm font-semibold text-[#1E2A3A]">{row.label}</span>
            <span className="font-mono text-sm text-[#5A6B80]">{row.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminNotificationManagement() {
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    apiClient
      .get("/admin/settings")
      .then(({ data }) => setSettings(data))
      .catch((error) => {
        setLoadError(getErrorMessage(error, "설정을 불러오지 못했습니다"));
      });
  }, []);

  const handleSave = () => {
    setSaving(true);
    apiClient
      .put("/admin/settings", settings)
      .then(({ data }) => {
        setSettings(data);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      })
      .catch((error) => {
        setLoadError(getErrorMessage(error, "저장에 실패했습니다"));
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="admin-notification-management flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar active="notifications" />

      <div className="flex min-h-screen w-full flex-col">
        <AdminHeader />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">알림 관리</h1>
              <p className="text-sm text-[#5A6B80]">이상 판정 기준과 시스템 설정</p>
            </div>
            {settings && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#2B6FE3] px-4 text-xs font-bold tracking-wide text-white disabled:opacity-60"
              >
                <Icon name="check" size={16} className="text-white" />
                {saving ? "저장 중..." : savedFlash ? "저장됨" : "변경사항 저장"}
              </button>
            )}
          </div>

          {loadError && <p className="text-sm font-semibold text-[#E0442E]">{loadError}</p>}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name="settings" size={15} className="text-[#5A6B80]" />
              <p className="text-xs font-bold tracking-wide text-[#5A6B80]">시스템 설정</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
              {settings ? (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-4 border-b border-[#DCE3EC] px-5 py-4">
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-bold text-[#1E2A3A]">조기경보(예측 모델)</p>
                      <p className="text-xs text-[#5A6B80]">
                        NEWS2 기준 위에 개인 평소 패턴 대비 이상탐지 모델을 추가로 적용합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.early_warning_enabled}
                      onClick={() =>
                        setSettings((current) => ({ ...current, early_warning_enabled: !current.early_warning_enabled }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        settings.early_warning_enabled ? "bg-[#2B6FE3]" : "bg-[#DCE3EC]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                          settings.early_warning_enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-[#DCE3EC] px-5 py-4">
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-bold text-[#1E2A3A]">응급 확정 지속시간</p>
                      <p className="text-xs text-[#5A6B80]">
                        응급 등급이 이 시간 이상 이어져야 보호자에게 통보합니다. 센서 순간 오작동을 걸러내기 위함입니다.
                      </p>
                    </div>
                    <div className="flex w-[100px] shrink-0 items-center justify-between rounded-lg border border-[#DCE3EC] px-3 py-[9px]">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={settings.danger_sustain_sec}
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, danger_sustain_sec: Number(event.target.value) }))
                        }
                        className="w-12 border-0 bg-transparent text-[15px] font-bold text-[#1E2A3A] focus:outline-none"
                      />
                      <span className="text-[11px] text-[#5A6B80]">초</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE3EC] px-5 py-4">
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-bold text-[#1E2A3A]">심박 응급(DANGER) 경계 · BPM</p>
                      <p className="text-xs text-[#5A6B80]">
                        NEWS2 기본값(40 / 131) 근처에서만 조정 가능합니다. 이 경계 안쪽의 주의·경고 세부 기준은 고정입니다.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {["heart_rate_danger_low", "heart_rate_danger_high"].map((field) => (
                        <div key={field} className="flex flex-col items-end gap-[5px]">
                          <span className="text-[11px] text-[#5A6B80]">{field.endsWith("low") ? "하한" : "상한"}</span>
                          <input
                            type="number"
                            min={DANGER_BOUND_LIMITS[field][0]}
                            max={DANGER_BOUND_LIMITS[field][1]}
                            value={settings[field]}
                            onChange={(event) =>
                              setSettings((current) => ({ ...current, [field]: Number(event.target.value) }))
                            }
                            className="w-[76px] rounded-lg border border-[#DCE3EC] px-3 py-[9px] text-[15px] font-bold text-[#1E2A3A] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-bold text-[#1E2A3A]">호흡 응급(DANGER) 경계 · 회/분</p>
                      <p className="text-xs text-[#5A6B80]">NEWS2 기본값(8 / 25) 근처에서만 조정 가능합니다.</p>
                    </div>
                    <div className="flex gap-3">
                      {["resp_rate_danger_low", "resp_rate_danger_high"].map((field) => (
                        <div key={field} className="flex flex-col items-end gap-[5px]">
                          <span className="text-[11px] text-[#5A6B80]">{field.endsWith("low") ? "하한" : "상한"}</span>
                          <input
                            type="number"
                            min={DANGER_BOUND_LIMITS[field][0]}
                            max={DANGER_BOUND_LIMITS[field][1]}
                            value={settings[field]}
                            onChange={(event) =>
                              setSettings((current) => ({ ...current, [field]: Number(event.target.value) }))
                            }
                            className="w-[76px] rounded-lg border border-[#DCE3EC] px-3 py-[9px] text-[15px] font-bold text-[#1E2A3A] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="p-4 text-sm text-[#5A6B80]">불러오는 중...</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name="bell-ring" size={15} className="text-[#5A6B80]" />
              <p className="text-xs font-bold tracking-wide text-[#5A6B80]">
                이상 판정 기준 · NEWS2 (주의·경고 구간은 고정, 응급 경계는 위 설정 참고)
              </p>
            </div>
            <div className="flex flex-col gap-6 xl:flex-row">
              {NEWS2_REFERENCE.map((metric) => (
                <News2Card key={metric.title} metric={metric} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNotificationManagement;
