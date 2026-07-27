import type { RouteObject } from "react-router-dom"
import Splash from "./screens/Splash"
import Terms from "./screens/Terms"
import Signup from "./screens/Signup"
import PatientInfo from "./screens/PatientInfo"
import Waiting from "./screens/Waiting"
import Login from "./screens/Login"
import Home from "./screens/Home"
import Notifications from "./screens/Notifications"
import Emergency from "./screens/Emergency"
import EmergencyGuide from "./screens/EmergencyGuide"
import Records from "./screens/Records"
import Settings from "./screens/Settings"
import AccountEdit from "./screens/AccountEdit"
import Help from "./screens/Help"

export const routes: RouteObject[] = [
  { path: "/", element: <Splash /> },
  { path: "/terms", element: <Terms /> },
  { path: "/signup", element: <Signup /> },
  { path: "/patient-info", element: <PatientInfo /> },
  { path: "/waiting", element: <Waiting /> },
  { path: "/login", element: <Login /> },
  { path: "/home", element: <Home /> },
  { path: "/notifications", element: <Notifications /> },
  { path: "/emergency", element: <Emergency /> },
  { path: "/emergency/guide", element: <EmergencyGuide /> },
  { path: "/records", element: <Records /> },
  { path: "/settings", element: <Settings /> },
  { path: "/settings/account", element: <AccountEdit /> },
  { path: "/help", element: <Help /> },
]
