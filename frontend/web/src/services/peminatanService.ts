import { api } from "../lib/api";
import type {
  PeminatanSayaResponse,
  PilihPeminatanPayload,
  PilihPeminatanResponse,
} from "../types";

export const peminatanService = {
  async getSaya(): Promise<PeminatanSayaResponse> {
    const { data } = await api.get<PeminatanSayaResponse>("/peminatan/saya");
    return data;
  },

  async pilih(payload: PilihPeminatanPayload): Promise<PilihPeminatanResponse> {
    const { data } = await api.patch<PilihPeminatanResponse>(
      "/peminatan/peminatan",
      payload,
    );
    return data;
  },
};
