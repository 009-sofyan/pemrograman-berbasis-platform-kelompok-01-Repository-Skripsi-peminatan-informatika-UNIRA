import { api } from "../lib/api";
import type {
  CreateSkripsiPayload,
  CreateSkripsiResponse,
  SimpleMessageResponse,
  SkripsiDetailResponse,
  SkripsiListParams,
  SkripsiListResponse,
  UploadSkripsiResponse,
} from "../types";

export const skripsiService = {
  async list(params: SkripsiListParams = {}): Promise<SkripsiListResponse> {
    const { data } = await api.get<SkripsiListResponse>("/skripsi", {
      params: {
        ...(params.search ? { search: params.search } : {}),
        ...(params.tahun ? { tahun: params.tahun } : {}),
        ...(params.programStudi ? { programStudi: params.programStudi } : {}),
        ...(params.peminatan ? { peminatan: params.peminatan } : {}),
      },
    });
    return data;
  },

  async getById(id: number): Promise<SkripsiDetailResponse> {
    const { data } = await api.get<SkripsiDetailResponse>(`/skripsi/${id}`);
    return data;
  },

  async listPublic(params: SkripsiListParams = {}): Promise<SkripsiListResponse> {
    const { data } = await api.get<SkripsiListResponse>("/skripsi/public", {
      params: {
        ...(params.search ? { search: params.search } : {}),
        ...(params.tahun ? { tahun: params.tahun } : {}),
        ...(params.programStudi ? { programStudi: params.programStudi } : {}),
        ...(params.peminatan ? { peminatan: params.peminatan } : {}),
      },
    });
    return data;
  },

  async getPublicById(id: number): Promise<SkripsiDetailResponse> {
    const { data } = await api.get<SkripsiDetailResponse>(`/skripsi/public/${id}`);
    return data;
  },

  async create(payload: CreateSkripsiPayload): Promise<CreateSkripsiResponse> {
    const { data } = await api.post<CreateSkripsiResponse>("/skripsi", payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<CreateSkripsiPayload>,
  ): Promise<SimpleMessageResponse> {
    const { data } = await api.put<SimpleMessageResponse>(`/skripsi/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<SimpleMessageResponse> {
    const { data } = await api.delete<SimpleMessageResponse>(`/skripsi/${id}`);
    return data;
  },

  async submit(id: number): Promise<SimpleMessageResponse> {
    const { data } = await api.patch<SimpleMessageResponse>(`/skripsi/${id}/submit`);
    return data;
  },

  async uploadFile(
    id: number,
    file: File,
    onProgress?: (value: number) => void,
  ): Promise<UploadSkripsiResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<UploadSkripsiResponse>(
      `/skripsi/${id}/upload`,
      formData,
      {
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded * 100) / event.total));
        },
      },
    );
    return data;
  },
};
