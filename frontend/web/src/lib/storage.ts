import type { User } from "../types";

const TOKEN_KEY = "repository-skripsi.token";
const USER_KEY = "repository-skripsi.user";
const TRACKED_PREFIX = "repository-skripsi.tracked";

export const AUTH_UNAUTHORIZED_EVENT = "repository-skripsi:unauthorized";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage can be unavailable in private mode */
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed || typeof parsed.id !== "number" || typeof parsed.role !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number" && id > 0);
  } catch {
    return [];
  }
}

export function getTrackedSkripsiIds(userId: number): number[] {
  return readIds(`${TRACKED_PREFIX}.${userId}`);
}

export function trackSkripsiId(userId: number, skripsiId: number) {
  const ids = getTrackedSkripsiIds(userId);
  if (ids.includes(skripsiId)) return;
  try {
    localStorage.setItem(
      `${TRACKED_PREFIX}.${userId}`,
      JSON.stringify([skripsiId, ...ids].slice(0, 30)),
    );
  } catch {
    /* ignore */
  }
}

export function untrackSkripsiId(userId: number, skripsiId: number) {
  const ids = getTrackedSkripsiIds(userId).filter((id) => id !== skripsiId);
  try {
    localStorage.setItem(`${TRACKED_PREFIX}.${userId}`, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
