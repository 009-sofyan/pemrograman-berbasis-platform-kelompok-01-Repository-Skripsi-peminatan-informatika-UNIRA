import axios from "axios";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearSession,
  getToken,
} from "../lib/storage";
import { API_BASE_URL } from "../lib/files";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    Accept: "application/json",
  },
});

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/register");
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url;
      if (!isAuthEndpoint(url)) {
        const hadSession = Boolean(getToken());
        clearSession();
        if (hadSession && typeof window !== "undefined") {
          const body = error.response.data as { message?: string } | undefined;
          window.dispatchEvent(
            new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
              detail: {
                message:
                  body?.message ??
                  "Sesi kamu telah berakhir. Silakan masuk kembali.",
              },
            }),
          );
        }
      }
    }
    return Promise.reject(error);
  },
);
