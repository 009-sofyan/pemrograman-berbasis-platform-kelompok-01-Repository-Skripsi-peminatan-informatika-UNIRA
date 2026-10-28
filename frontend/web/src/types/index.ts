export type Role = "mahasiswa" | "kaprodi" | "tendik";

export type SkripsiStatus = "draft" | "diajukan" | "disetujui" | "ditolak";

export type PeminatanValue = string | null;

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  createdAt?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nama: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export interface Skripsi {
  id: number;
  judul: string;
  abstrak: string | null;
  tahun: number;
  fileUrl: string | null;
  status: SkripsiStatus;
  createdAt: string | null;
  mahasiswaId: number;
  nim: string;
  programStudi: string;
  peminatan: PeminatanValue;
  namaMahasiswa?: string;
  emailMahasiswa?: string;
}

export interface SkripsiListResponse {
  message: string;
  total: number;
  data: Skripsi[];
}

export interface SkripsiDetailResponse {
  message: string;
  data: Skripsi;
}

export interface SkripsiListParams {
  search?: string;
  tahun?: string;
  programStudi?: string;
  peminatan?: string;
}

export interface CreateSkripsiPayload {
  judul: string;
  abstrak?: string;
  tahun: number;
}

export interface CreateSkripsiResponse {
  message: string;
  id: number;
}

export interface UploadSkripsiResponse {
  message: string;
  fileUrl: string;
}

export interface SimpleMessageResponse {
  message: string;
}

export interface Mahasiswa {
  id: number;
  userId: number;
  nama: string;
  email: string;
  nim: string;
  programStudi: string;
  peminatan: PeminatanValue;
}

export interface MahasiswaListResponse {
  message: string;
  total: number;
  data: Mahasiswa[];
}

export interface MahasiswaDetailResponse {
  message: string;
  data: Mahasiswa;
}

export interface CreateMahasiswaPayload {
  email: string;
  nim: string;
  programStudi: string;
}

export interface UpdateMahasiswaPayload {
  nama: string;
  email: string;
  nim: string;
  programStudi: string;
  peminatan?: string | null;
}

export interface PengajuanListResponse {
  message: string;
  total: number;
  data: Skripsi[];
}

export interface StatusCount {
  status: SkripsiStatus;
  total: number;
}

export interface PeminatanCount {
  peminatan: PeminatanValue;
  total: number;
}

export interface DashboardResponse {
  message: string;
  totalMahasiswa: number;
  totalSkripsi: number;
  statusskripsi: StatusCount[];
  peminatanMahasiswa: PeminatanCount[];
}

export interface PemetaanResponse {
  message: string;
  totalMemilih: number;
  data: {
    peminatan: PeminatanValue;
    totalMahasiswa: number;
  }[];
}

export interface PilihPeminatanPayload {
  peminatan: "Business Intelligence" | "Smart Agriculture";
}

export interface PilihPeminatanResponse {
  message: string;
  peminatan: string;
}
