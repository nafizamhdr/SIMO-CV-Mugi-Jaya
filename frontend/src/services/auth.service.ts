import { api, unwrap, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./api";
import type { ApiSuccess, AuthResult, Role } from "../types";

/**
 * Authentication API (FR-13). Persists tokens in localStorage.
 * `role` (pilihan di form) divalidasi backend harus cocok dengan role akun.
 */
export async function login(email: string, password: string, role?: Role): Promise<AuthResult> {
  const { data } = await api.post<ApiSuccess<AuthResult>>("/auth/login", { email, password, role });
  const result = unwrap(data);
  localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
  return result;
}

export async function refresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("Tidak ada refresh token");
  const { data } = await api.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    "/auth/refresh",
    { refreshToken },
  );
  const tokens = unwrap(data);
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  return tokens.accessToken;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  try {
    if (refreshToken) await api.post("/auth/logout", { refreshToken });
  } finally {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
