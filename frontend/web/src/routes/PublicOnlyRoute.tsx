import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLE_LANDING } from "../constants";

export function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_LANDING[user.role]} replace />;
  }

  return <Outlet />;
}
