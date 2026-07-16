import { Navigate, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/hospital-code" element={<HospitalCodeRegister />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/find-password" element={<FindPassword />} />
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
    </Routes>
  );
}

export default App;
