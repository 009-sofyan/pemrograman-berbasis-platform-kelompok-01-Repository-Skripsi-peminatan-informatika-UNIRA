import { api } from "../lib/api";
import type {
  AuthResponse,
  LoginPayload,
  ProfileResponse,
  RegisterPayload,
  RegisterResponse,
} from "../types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>("/auth/register", payload);
    return data;
  },

  async me(): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>("/auth/me");
    return data;
  },
};
