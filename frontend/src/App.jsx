import { Navigate, Route, Routes } from "react-router-dom";
import RequireRole from "./components/auth/require-role.jsx";
import Login from "./pages/auth/login/login.jsx";
import Signup from "./pages/auth/signup/signup.jsx";
import HospitalCodeRegister from "./pages/auth/hospital-code-register/hospital-code-register.jsx";
import AdminLogin from "./pages/auth/admin-login/admin-login.jsx";
import FindPassword from "./pages/auth/find-password/find-password.jsx";
import Dashboard from "./pages/dashboard/dashboard.jsx";
import PatientList from "./pages/patient-list/patient-list.jsx";
import PatientDetail from "./pages/patient-detail/patient-detail.jsx";
import RealtimeMonitoring from "./pages/realtime-monitoring/realtime-monitoring.jsx";
import Notifications from "./pages/notifications/notifications.jsx";
import IntegrationRequestManagement from "./pages/integration-request-management/integration-request-management.jsx";
import IntegrationRequestDetail from "./pages/integration-request-detail/integration-request-detail.jsx";
import AdminHospitalManagement from "./pages/admin/hospital-management/hospital-management.jsx";
import HospitalDetail from "./pages/admin/hospital-detail/hospital-detail.jsx";
import AdminDeviceManagement from "./pages/admin/device-management/device-management.jsx";
import DeviceDetail from "./pages/admin/device-detail/device-detail.jsx";
import AdminNotificationManagement from "./pages/admin/notification-management/notification-management.jsx";
import AdminPermissionManagement from "./pages/admin/permission-management/permission-management.jsx";
import PersonalSettings from "./pages/personal-settings/personal-settings.jsx";
import DevVitals from "./pages/dev-vitals/dev-vitals.jsx";
import DevComponentLibrary from "./pages/dev-component-library/dev-component-library.jsx";

import GuardianInvite from "./guardian/screens/Invite.tsx";
import GuardianSplash from "./guardian/screens/Splash.tsx";
import GuardianLogin from "./guardian/screens/Login.tsx";
import GuardianTerms from "./guardian/screens/Terms.tsx";
import GuardianSignup from "./guardian/screens/Signup.tsx";
import GuardianFindId from "./guardian/screens/FindId.tsx";
import GuardianFindPassword from "./guardian/screens/FindPassword.tsx";
import GuardianResetPassword from "./guardian/screens/ResetPassword.tsx";
import GuardianPatientInfo from "./guardian/screens/PatientInfo.tsx";
import GuardianWaiting from "./guardian/screens/Waiting.tsx";
import GuardianHome from "./guardian/screens/Home.tsx";
import GuardianNotifications from "./guardian/screens/Notifications.tsx";
import GuardianEmergency from "./guardian/screens/Emergency.tsx";
import GuardianEmergencyGuide from "./guardian/screens/EmergencyGuide.tsx";
import GuardianRecords from "./guardian/screens/Records.tsx";
import GuardianSettings from "./guardian/screens/Settings.tsx";
import GuardianAccountEdit from "./guardian/screens/AccountEdit.tsx";
import GuardianHelp from "./guardian/screens/Help.tsx";
import RequireLinkedPatient from "./guardian/components/RequireLinkedPatient.tsx";
// 개발용: 병원 주소가 카카오 지도에서 찾아지는지 일괄 점검 (개발 모드에서만 동작)
import DevHospitalMap from "./pages/dev-hospital-map/dev-hospital-map.tsx";
// 개발용: 목업 병원으로 쓸 실제 요양병원을 카카오에서 찾아온다 (개발 모드에서만 동작)
import DevHospitalFind from "./pages/dev-hospital-find/dev-hospital-find.tsx";
// 개발용: 보호자에게 문자로 보낼 초대 링크를 만든다 (개발 모드에서만 동작)
import DevInviteLink from "./pages/dev-invite-link/dev-invite-link.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/hospital-code" element={<HospitalCodeRegister />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/find-password" element={<FindPassword />} />

      {/* 개발용 점검 화면. 로그인 없이 열 수 있게 두되, 화면 자체가 개발 모드에서만 동작한다 */}
      <Route path="/dev/hospital-map" element={<DevHospitalMap />} />
      <Route path="/dev/hospital-find" element={<DevHospitalFind />} />
      <Route path="/dev/invite-link" element={<DevInviteLink />} />

      {/* 병원 스태프 전용 (role: DEPARTMENT, ADMIN) */}
      <Route element={<RequireRole allow={["DEPARTMENT", "ADMIN"]} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:patientId" element={<PatientDetail />} />
        <Route path="/monitoring" element={<RealtimeMonitoring />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/integration-requests" element={<IntegrationRequestManagement />} />
        <Route path="/integration-requests/:requestId" element={<IntegrationRequestDetail />} />
        <Route path="/admin/hospitals" element={<AdminHospitalManagement />} />
        <Route path="/admin/hospitals/:hospitalId" element={<HospitalDetail />} />
        <Route path="/admin/devices" element={<AdminDeviceManagement />} />
        <Route path="/admin/devices/:deviceId" element={<DeviceDetail />} />
        <Route path="/admin/notifications" element={<AdminNotificationManagement />} />
        <Route path="/admin/permissions" element={<AdminPermissionManagement />} />
        <Route path="/personal-settings" element={<PersonalSettings />} />
        <Route path="/dev/vitals" element={<DevVitals />} />
        <Route path="/dev/components" element={<DevComponentLibrary />} />
      </Route>

      {/* 보호자 회원가입 온보딩 (로그인 전, 공개) */}
      {/* 문자로 받은 초대 링크가 여는 화면. 주소의 토큰(?k=)을 풀어 병원 코드를 저장하고
          "홈 화면에 추가"(웹앱 설치)를 안내한다 */}
      <Route path="/guardian/invite" element={<GuardianInvite />} />
      <Route path="/guardian" element={<GuardianSplash />} />
      <Route path="/guardian/login" element={<GuardianLogin />} />
      <Route path="/guardian/terms" element={<GuardianTerms />} />
      <Route path="/guardian/signup" element={<GuardianSignup />} />
      <Route path="/guardian/find-id" element={<GuardianFindId />} />
      <Route path="/guardian/find-password" element={<GuardianFindPassword />} />
      {/* 메일로 받은 재설정 링크가 여는 화면. 링크의 token이 본인 확인을 대신하므로 로그인 불필요 */}
      <Route path="/guardian/reset-password" element={<GuardianResetPassword />} />
      <Route path="/guardian/patient-info" element={<GuardianPatientInfo />} />
      <Route path="/guardian/waiting" element={<GuardianWaiting />} />

      {/* 보호자 전용 (role: GUARDIAN)
          RequireLinkedPatient: 아직 병원 승인을 못 받아 연결된 환자가 없으면
          빈 화면 대신 승인 대기 화면으로 보낸다 */}
      <Route element={<RequireRole allow={["GUARDIAN"]} />}>
        <Route element={<RequireLinkedPatient />}>
          <Route path="/guardian/home" element={<GuardianHome />} />
          <Route path="/guardian/notifications" element={<GuardianNotifications />} />
          <Route path="/guardian/emergency" element={<GuardianEmergency />} />
          <Route path="/guardian/emergency/guide" element={<GuardianEmergencyGuide />} />
          <Route path="/guardian/records" element={<GuardianRecords />} />
          <Route path="/guardian/settings" element={<GuardianSettings />} />
          <Route path="/guardian/settings/account" element={<GuardianAccountEdit />} />
          <Route path="/guardian/help" element={<GuardianHelp />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
