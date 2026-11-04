import { api } from "../lib/api";
import type {
  ApproveRegistrationPayload,
  RegistrationListParams,
  RegistrationListResponse,
  RejectRegistrationPayload,
  SimpleMessageResponse,
} from "../types";

export const tendikService = {
  async listRegistrations(
    params: RegistrationListParams = {},
  ): Promise<RegistrationListResponse> {
    const { data } = await api.get<RegistrationListResponse>(
      "/tendik/registrasi",
      {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.q ? { q: params.q } : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
      },
    );
    return data;
  },

  async approveRegistration(
    id: number,
    payload: ApproveRegistrationPayload,
  ): Promise<SimpleMessageResponse> {
    const { data } = await api.post<SimpleMessageResponse>(
      `/tendik/registrasi/${id}/setujui`,
      payload,
    );
    return data;
  },

  async rejectRegistration(
    id: number,
    payload: RejectRegistrationPayload,
  ): Promise<SimpleMessageResponse> {
    const { data } = await api.post<SimpleMessageResponse>(
      `/tendik/registrasi/${id}/tolak`,
      payload,
    );
    return data;
  },
};
