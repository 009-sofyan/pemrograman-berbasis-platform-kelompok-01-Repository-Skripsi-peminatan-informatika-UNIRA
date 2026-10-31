import {
  BadgeCheck,
  ChartPie,
  FilePlus2,
  LayoutDashboard,
  Library,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PeminatanValue, Role, SkripsiStatus } from "../types";

export const APP_NAME = "Repository Skripsi";
export const APP_SUBTITLE = "Peminatan Informatika UNIRA";
export const PROGRAM_STUDI_DEFAULT = "Informatika";
export const CURRENT_YEAR = new Date().getFullYear();

export const BI = "Business Intelligence";
export const SA = "Smart Agriculture";

export const PEMINATAN_OPTIONS = [
  { value: BI, label: "Business Intelligence", short: "BI" },
  { value: SA, label: "Smart Agriculture", short: "SA" },
] as const;

export type Tone =
  | "indigo"
  | "bi"
  | "sa"
  | "mint"
  | "sky"
  | "amber"
  | "coral"
  | "rose"
  | "violet"
  | "navy"
  | "gold"
  | "slate";

export const ROLE_META: Record<
  Role,
  { label: string; description: string; tone: Tone }
> = {
  mahasiswa: {
    label: "Mahasiswa",
    description: "Repository, pengajuan skripsi, dan profil akademik.",
    tone: "sky",
  },
  kaprodi: {
    label: "Kaprodi",
    description: "Verifikasi pengajuan dan pemetaan peminatan.",
    tone: "indigo",
  },
  tendik: {
    label: "Tendik",
    description: "Pengelolaan data akademik dan mahasiswa.",
    tone: "mint",
  },
};

export const STATUS_META: Record<
  SkripsiStatus,
  { label: string; description: string; tone: Tone; color: string }
> = {
  draft: {
    label: "Draft",
    description: "Belum diajukan",
    tone: "slate",
    color: "#94A3B8",
  },
  diajukan: {
    label: "Menunggu",
    description: "Menunggu verifikasi Kaprodi",
    tone: "amber",
    color: "#F59E0B",
  },
  disetujui: {
    label: "Disetujui",
    description: "Sudah lolos verifikasi",
    tone: "sa",
    color: "#10B981",
  },
  ditolak: {
    label: "Ditolak",
    description: "Perlu diperbaiki",
    tone: "rose",
    color: "#D32F2F",
  },
};

export const STATUS_ORDER: SkripsiStatus[] = [
  "draft",
  "diajukan",
  "disetujui",
  "ditolak",
];

export function getPeminatanMeta(value: PeminatanValue): {
  label: string;
  short: string;
  tone: Tone;
  color: string;
} {
  if (!value) {
    return {
      label: "Belum memilih",
      short: "—",
      tone: "slate",
      color: "#CBD5E1",
    };
  }

  if (value === BI) {
    return { label: "Business Intelligence", short: "BI", tone: "bi", color: "#6366F1" };
  }

  if (value === SA) {
    return {
      label: "Smart Agriculture",
      short: "SA",
      tone: "sa",
      color: "#10B981",
    };
  }

  return { label: value, short: "Lainnya", tone: "violet", color: "#8B5CF6" };
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
  section: "Utama" | "Kelola" | "Akun";
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    roles: ["mahasiswa", "kaprodi", "tendik"],
    section: "Utama",
  },
  {
    label: "Repository Skripsi",
    to: "/repository",
    icon: Library,
    roles: ["mahasiswa", "kaprodi", "tendik"],
    section: "Utama",
  },
  {
    label: "Pengajuan Skripsi",
    to: "/pengajuan",
    icon: FilePlus2,
    roles: ["mahasiswa"],
    section: "Utama",
  },
  {
    label: "Peminatan Riset",
    to: "/peminatan",
    icon: Target,
    roles: ["mahasiswa"],
    section: "Utama",
  },
  {
    label: "Verifikasi Skripsi",
    to: "/persetujuan",
    icon: BadgeCheck,
    roles: ["kaprodi"],
    section: "Kelola",
  },
  {
    label: "Pemetaan Peminatan",
    to: "/pemetaan",
    icon: ChartPie,
    roles: ["kaprodi"],
    section: "Kelola",
  },
  {
    label: "Data Mahasiswa",
    to: "/mahasiswa",
    icon: Users,
    roles: ["tendik"],
    section: "Kelola",
  },
  {
    label: "Profil Saya",
    to: "/profil",
    icon: UserRound,
    roles: ["mahasiswa", "kaprodi", "tendik"],
    section: "Akun",
  },
];

export const ROLE_LANDING: Record<Role, string> = {
  mahasiswa: "/dashboard",
  kaprodi: "/dashboard",
  tendik: "/dashboard",
};

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/repository": "Repository Skripsi",
  "/pengajuan": "Pengajuan Skripsi",
  "/peminatan": "Peminatan Riset",
  "/persetujuan": "Verifikasi Skripsi",
  "/pemetaan": "Pemetaan Peminatan",
  "/mahasiswa": "Data Mahasiswa",
  "/profil": "Profil Saya",
};

export const ROLE_CAPABILITIES: Record<Role, string[]> = {
  mahasiswa: [
    "Menelusuri repository dan mengunduh referensi skripsi",
    "Mengajukan skripsi beserta berkas PDF",
    "Memilih peminatan Business Intelligence atau Smart Agriculture",
  ],
  kaprodi: [
    "Meninjau pengajuan skripsi mahasiswa",
    "Menyetujui atau menolak pengajuan",
    "Memantau pemetaan peminatan BI dan SA",
  ],
  tendik: [
    "Mengelola data mahasiswa dan peminatan",
    "Menambahkan akun mahasiswa yang sudah terdaftar",
    "Memantau seluruh data repository skripsi",
  ],
};

export const CURRENT_ROLE_HELP: Record<Role, string> = {
  mahasiswa:
    "Pastikan data akademikmu sudah dilengkapi Tendik sebelum mengajukan skripsi.",
  kaprodi:
    "Pengajuan yang masuk akan tampil di halaman verifikasi dan dapat langsung diproses.",
  tendik:
    "Mahasiswa harus mendaftar akun terlebih dahulu sebelum data akademiknya ditambahkan.",
};

export const CHART_COLORS = {
  indigo: "#6366F1",
  bi: "#6366F1",
  violet: "#8B5CF6",
  sky: "#6366F1",
  mint: "#10B981",
  sa: "#10B981",
  amber: "#F59E0B",
  coral: "#D32F2F",
  navy: "#14234F",
  gold: "#F5C518",
  slate: "#CBD5E1",
};
