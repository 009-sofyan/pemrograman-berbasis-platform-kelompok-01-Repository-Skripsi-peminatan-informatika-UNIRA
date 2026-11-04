import { api, publicApi } from "../lib/api";
import { API_BASE_URL } from "../lib/files";
import type {
  CreateSkripsiPayload,
  CreateSkripsiResponse,
  SimpleMessageResponse,
  SkripsiCoverResponse,
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

  async downloadFile(id: number): Promise<Blob> {
    const { data } = await api.get<Blob>(`/skripsi/${id}/download`, {
      responseType: "blob",
    });
    return data;
  },

  /**
   * Unduhan publik tidak membawa header Authorization sama sekali, bahkan
   * ketika pengguna sedang login. Dengan begitu kartu katalog tidak pernah
   * memicu sesi berakhir atau redirect login saat PDF tidak tersedia.
   */
  async downloadPublicFile(id: number, inline = false): Promise<Blob> {
    const { data } = await publicApi.get<Blob>(`/skripsi/${id}/download`, {
      params: inline ? { inline: "1" } : undefined,
      responseType: "blob",
    });
    return data;
  },

  publicPdfUrl(id: number, inline = false): string {
    const base = API_BASE_URL.replace(/\/+$/, "");
    return `${base}/skripsi/${id}/download${inline ? "?inline=1" : ""}`;
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

  async uploadCover(id: number, file: File): Promise<SkripsiCoverResponse> {
    const formData = new FormData();
    formData.append("cover", file);
    const { data } = await api.post<SkripsiCoverResponse>(
      `/skripsi/${id}/cover`,
      formData,
    );
    return data;
  },

  async removeCover(id: number): Promise<SkripsiCoverResponse> {
    const { data } = await api.delete<SkripsiCoverResponse>(`/skripsi/${id}/cover`);
    return data;
  },
};
