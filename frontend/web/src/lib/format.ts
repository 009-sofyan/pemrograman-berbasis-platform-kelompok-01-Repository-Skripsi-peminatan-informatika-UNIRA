export function formatDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "??";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function getAngkatan(nim: string): string {
  if (!nim) return "—";
  const fullYear = nim.match(/^(20\d{2})/);
  if (fullYear?.[1]) return fullYear[1];
  const shortYear = nim.match(/^(\d{2})/);
  if (shortYear?.[1]) return `20${shortYear[1]}`;
  return "—";
}

export function truncate(value: string, max = 110): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export function parseJwtExpiry(token: string): Date | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      decodeURIComponent(
        Array.from(atob(normalized))
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    ) as { exp?: number };
    if (typeof decoded.exp !== "number") return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}
