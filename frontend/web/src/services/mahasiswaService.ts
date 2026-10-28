import { api } from "../lib/api";
import type {
  CreateMahasiswaPayload,
  MahasiswaDetailResponse,
  MahasiswaListResponse,
  SimpleMessageResponse,
  UpdateMahasiswaPayload,
} from "../types";

export const mahasiswaService = {
  async list(): Promise<MahasiswaListResponse> {
    const { data } = await api.get<MahasiswaListResponse>("/mahasiswa");
    return data;
  },

  async getById(id: number): Promise<MahasiswaDetailResponse> {
    const { data } = await api.get<MahasiswaDetailResponse>(`/mahasiswa/${id}`);
    return data;
  },

  async create(payload: CreateMahasiswaPayload): Promise<SimpleMessageResponse> {
    const { data } = await api.post<SimpleMessageResponse>("/mahasiswa", payload);
    return data;
  },

  async update(
    id: number,
    payload: UpdateMahasiswaPayload,
  ): Promise<SimpleMessageResponse> {
    const { data } = await api.put<SimpleMessageResponse>(`/mahasiswa/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<SimpleMessageResponse> {
    const { data } = await api.delete<SimpleMessageResponse>(`/mahasiswa/${id}`);
    return data;
  },
};
