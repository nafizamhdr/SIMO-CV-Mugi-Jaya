import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Access the authenticated user and auth actions.
 * Must be used inside an <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return ctx;
}
