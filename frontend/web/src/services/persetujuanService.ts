import { api } from "../lib/api";
import type { PengajuanListResponse, SimpleMessageResponse } from "../types";

export const persetujuanService = {
  async list(): Promise<PengajuanListResponse> {
    const { data } = await api.get<PengajuanListResponse>("/persetujuan");
    return data;
  },

  async approve(id: number): Promise<SimpleMessageResponse> {
    const { data } = await api.patch<SimpleMessageResponse>(
      `/persetujuan/${id}/approve`,
    );
    return data;
  },

  async reject(id: number): Promise<SimpleMessageResponse> {
    const { data } = await api.patch<SimpleMessageResponse>(
      `/persetujuan/${id}/reject`,
    );
    return data;
  },
};
