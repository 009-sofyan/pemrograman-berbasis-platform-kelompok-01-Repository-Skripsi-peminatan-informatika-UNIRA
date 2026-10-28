import { api } from "../lib/api";
import type { DashboardResponse, PemetaanResponse } from "../types";

export const dashboardService = {
  async get(): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>("/dashboard");
    return data;
  },
};

export const pemetaanService = {
  async get(): Promise<PemetaanResponse> {
    const { data } = await api.get<PemetaanResponse>("/pemetaan");
    return data;
  },
};
