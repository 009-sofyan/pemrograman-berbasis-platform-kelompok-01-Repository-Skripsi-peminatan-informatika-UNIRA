import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data;
    if (
      message &&
      typeof message === "object" &&
      "message" in message &&
      typeof (message as { message?: unknown }).message === "string"
    ) {
      return (message as { message: string }).message;
    }

    if (error.code === "ERR_NETWORK") {
      return "Tidak dapat terhubung ke server. Pastikan backend berjalan di http://localhost:3000.";
    }

    if (error.code === "ECONNABORTED") {
      return "Permintaan melebihi batas waktu. Silakan coba lagi.";
    }

    if (error.response?.status === 413) {
      return "Ukuran berkas terlalu besar. Maksimal 10 MB.";
    }

    if (error.response?.status === 500) {
      return "Server mengalami kendala. Silakan coba beberapa saat lagi.";
    }

    if (typeof error.message === "string" && error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isForbidden(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
