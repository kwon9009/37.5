import { useState } from "react";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import Header from "../../components/header/header.jsx";
import Icon from "../../components/icon/icon.jsx";

const NOTIFICATION_TOGGLES = [
  { key: "emergencyAlerts", label: "담당 환자 응급 알림", desc: "담당 환자에게 응급 상황이 발생하면 즉시 알림을 받습니다", default: true },
  { key: "sensorDisconnectAlerts", label: "센서 연결 끊김 알림", desc: "모니터링 센서 연결이 끊기면 알림을 받습니다", default: true },
  { key: "weeklyReport", label: "일일 근무 요약 리포트", desc: "근무 종료 시 담당 환자 요약 리포트를 이메일로 받습니다", default: false },
];

const LOGIN_ACTIVITY = [
  { device: "Chrome · Windows", ip: "121.140.55.2", time: "방금", current: true },
  { device: "Safari · macOS", ip: "121.140.55.2", time: "어제 18:22", current: false },
  { device: "Chrome · Android", ip: "182.220.11.9", time: "07-07 08:03", current: false },
];

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-6 w-11 shrink-0 items-center rounded-full p-[3px] transition-colors"
      style={{ backgroundColor: checked ? "#2B6FE3" : "#DCE3EC", justifyContent: checked ? "flex-end" : "flex-start" }}
    >
      <span className="h-[18px] w-[18px] rounded-full bg-white" />
    </button>
  );
}

function PersonalSettings() {
  const [name, setName] = useState("김간호");
  const [email, setEmail] = useState("kim.hana@vitalguard.io");
  const [phone, setPhone] = useState("010-4471-2298");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [notifications, setNotifications] = useState(
    Object.fromEntries(NOTIFICATION_TOGGLES.map((item) => [item.key, item.default]))
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "현재 비밀번호를 입력하고, 새 비밀번호는 8자 이상 · 동일하게 입력해 주세요" });
      return;
    }
    setPasswordMessage({ type: "success", text: "비밀번호가 변경되었습니다" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="personal-settings flex min-h-screen bg-[#F5F7FA]">
      <Sidebar active={null} />

      <div className="flex min-h-screen w-full flex-col">
        <Header />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#1E2A3A]">개인설정</h1>
              <p className="text-sm text-[#5A6B80]">계정 정보와 보안, 알림 환경을 설정합니다</p>
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
            <div className="flex w-full flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">프로필 정보</p>
                </div>
                <div className="flex flex-col gap-5 p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#1E2A3A] text-2xl font-extrabold text-[#2B6FE3]">
                      {name.charAt(0)}
                    </span>
                    <div className="flex flex-1 flex-col gap-[6px]">
                      <p className="text-lg font-bold text-[#1E2A3A]">{name}</p>
                      <span className="w-fit rounded px-2 py-[3px] font-mono text-[11px] font-bold text-[#2B6FE3]" style={{ backgroundColor: "#2B6FE333" }}>
                        간호사 · RN
                      </span>
                    </div>
                    <button
                      type="button"
                      className="flex shrink-0 items-center gap-[6px] rounded-lg bg-[#EDF1F6] px-[14px] py-2 text-xs font-semibold text-[#5A6B80]"
                    >
                      <Icon name="camera" size={14} className="text-[#5A6B80]" />
                      사진 변경
                    </button>
                  </div>

                  <div className="h-px bg-[#DCE3EC]" />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="settingsName" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        이름
                      </label>
                      <input
                        id="settingsName"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="settingsEmail" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        이메일
                      </label>
                      <input
                        id="settingsEmail"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="settingsPhone" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        연락처
                      </label>
                      <input
                        id="settingsPhone"
                        type="text"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] font-mono text-sm text-[#1E2A3A] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold tracking-wide text-[#5A6B80]">소속</span>
                      <div className="flex h-11 items-center rounded-lg border border-[#DCE3EC] bg-[#EDF1F6] px-[14px] text-sm text-[#5A6B80]">
                        우송대학교병원 · 3병동 간호스테이션
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">비밀번호 변경</p>
                </div>
                <div className="flex flex-col gap-4 p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="currentPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        현재 비밀번호
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="••••••••"
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="newPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        새 비밀번호
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="8자 이상 입력"
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="confirmNewPassword" className="text-xs font-bold tracking-wide text-[#5A6B80]">
                        비밀번호 확인
                      </label>
                      <input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="다시 입력"
                        className="h-11 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-[14px] text-sm text-[#1E2A3A] placeholder:text-[#5A6B80] focus:outline-none"
                      />
                    </div>
                  </div>

                  {passwordMessage && (
                    <p className={`text-xs font-semibold ${passwordMessage.type === "error" ? "text-[#E0442E]" : "text-[#2FA35C]"}`}>
                      {passwordMessage.text}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="h-[42px] w-fit rounded-lg bg-[#2B6FE3] px-6 text-sm font-bold text-white"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">알림 환경설정</p>
                </div>
                <div className="flex flex-col px-5 pb-3 pt-2">
                  {NOTIFICATION_TOGGLES.map((item, index) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between gap-4 py-[14px] ${
                        index < NOTIFICATION_TOGGLES.length - 1 ? "border-b border-[#DCE3EC]" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-[3px]">
                        <p className="text-sm font-semibold text-[#1E2A3A]">{item.label}</p>
                        <p className="text-xs text-[#5A6B80]">{item.desc}</p>
                      </div>
                      <ToggleSwitch
                        checked={notifications[item.key]}
                        onChange={(value) => setNotifications((current) => ({ ...current, [item.key]: value }))}
                        label={item.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:shrink-0">
              <div className="flex flex-col gap-[14px] rounded-xl bg-[#1E2A3A] p-5">
                <Icon name="shield-check" size={32} className="text-[#2B6FE3]" />
                <div className="flex flex-col gap-[2px]">
                  <p className="text-lg font-bold text-white">{name}</p>
                  <p className="font-mono text-[11px] font-bold text-[#8B8FA3]">간호사 · RN</p>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B8FA3]">입사일</span>
                  <span className="font-mono text-xs font-semibold text-white">2024-03-12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B8FA3]">마지막 로그인</span>
                  <span className="font-mono text-xs font-semibold text-white">2026-07-09 09:14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B8FA3]">접속 IP</span>
                  <span className="font-mono text-xs font-semibold text-white">121.140.55.2</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
                <div className="border-b border-[#DCE3EC] px-5 py-4">
                  <p className="text-base font-bold text-[#1E2A3A]">보안</p>
                </div>
                <div className="flex flex-col gap-[14px] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-[3px]">
                      <p className="text-sm font-semibold text-[#1E2A3A]">2단계 인증 (2FA)</p>
                      <p className="text-xs text-[#5A6B80]">로그인 시 OTP 인증을 추가로 요구합니다</p>
                    </div>
                    <ToggleSwitch checked={twoFactorEnabled} onChange={setTwoFactorEnabled} label="2단계 인증" />
                  </div>

                  <div className="h-px bg-[#DCE3EC]" />

                  <p className="text-xs font-bold tracking-wide text-[#5A6B80]">최근 로그인 활동</p>

                  {LOGIN_ACTIVITY.map((item) => (
                    <div key={item.device} className="flex items-center gap-[10px]">
                      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: item.current ? "#2FA35C" : "#2e3138" }} />
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <p className="truncate text-[13px] font-semibold text-[#1E2A3A]">{item.device}</p>
                        <p className="font-mono text-[11px] text-[#5A6B80]">{item.ip}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#5A6B80]">{item.time}</span>
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

export default PersonalSettings;
