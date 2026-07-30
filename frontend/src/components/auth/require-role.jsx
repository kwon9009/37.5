import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store.js";

const ROLE_HOME = {
  GUARDIAN: "/guardian/home",
  DEPARTMENT: "/dashboard",
  ADMIN: "/dashboard",
};

function RequireRole({ allow }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const location = useLocation();

  if (!accessToken || !role) {
    let loginPath = "/login";
    if (location.pathname.startsWith("/guardian")) loginPath = "/guardian/login";
    else if (location.pathname.startsWith("/admin")) loginPath = "/admin-login";
    return <Navigate to={loginPath} replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? "/login"} replace />;
  }

  return <Outlet />;
}

export default RequireRole;
