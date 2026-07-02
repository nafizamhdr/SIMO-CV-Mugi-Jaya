import axios, { type AxiosInstance } from "axios";

/**
 * Shared Axios instance. ALL API calls must go through a service that uses this
 * client — components must never call axios/fetch directly (aturan CLAUDE.md §7).
 */
export const ACCESS_TOKEN_KEY = "simo_access_token";
export const REFRESH_TOKEN_KEY = "simo_refresh_token";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// Catatan: Content-Type sengaja tidak di-set global agar Axios otomatis memakai
// application/json untuk body objek, dan multipart/form-data (+ boundary) untuk FormData.
export const api: AxiosInstance = axios.create({ baseURL });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Ambil pesan error dari respons API (envelope { error }) bila ada;
 * fallback ke message umum.
 */
export function extractApiError(err: unknown, fallback = "Terjadi kesalahan"): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const resp = (err as { response?: { data?: { error?: string } } }).response;
    if (resp?.data?.error) return resp.data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Unwrap the standard { success, data } envelope, throwing on API errors.
 */
export function unwrap<T>(payload: { success: boolean; data?: T; error?: string }): T {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.error ?? "Permintaan gagal");
  }
  return payload.data;
}
