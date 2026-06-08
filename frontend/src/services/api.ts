import axios, { type AxiosInstance } from "axios";

/**
 * Shared Axios instance. ALL API calls must go through a service that uses this
 * client — components must never call axios/fetch directly (aturan CLAUDE.md §7).
 */
export const ACCESS_TOKEN_KEY = "simo_access_token";
export const REFRESH_TOKEN_KEY = "simo_refresh_token";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Unwrap the standard { success, data } envelope, throwing on API errors.
 */
export function unwrap<T>(payload: { success: boolean; data?: T; error?: string }): T {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.error ?? "Permintaan gagal");
  }
  return payload.data;
}
