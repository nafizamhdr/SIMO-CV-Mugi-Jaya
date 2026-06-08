import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../../types";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  /** Roles allowed to access this route. Omit to allow any authenticated user. */
  allow?: Role[];
}

/**
 * Route guard berbasis role.
 * - Belum login  -> redirect ke /login
 * - Role tidak diizinkan -> redirect ke /403 (Forbidden), BUKAN ke login
 */
export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allow && allow.length > 0 && !hasRole(allow)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
