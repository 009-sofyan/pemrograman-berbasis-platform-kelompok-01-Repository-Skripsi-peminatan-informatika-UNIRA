import { api } from "../lib/api";
import type { PilihPeminatanPayload, PilihPeminatanResponse } from "../types";

export const peminatanService = {
  async pilih(payload: PilihPeminatanPayload): Promise<PilihPeminatanResponse> {
    const { data } = await api.patch<PilihPeminatanResponse>(
      "/peminatan/peminatan",
      payload,
    );
    return data;
  },
};
