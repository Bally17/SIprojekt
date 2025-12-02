import { api } from "@lib/api-client";
import type { RoleType } from "@type/props/common/globalTypes";

export type LoginResponse = {
  access_token?: string;
  refresh_token?: string;
  tokens?: {
    access?: string;
    refresh?: string;
  };
  user: {
    rola: string;
    [key: string]: unknown;
  };
};

type LoginPayload = {
  role: RoleType;
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { role, email, password } = payload;

  const endpoint =
    role === "student"
      ? "/auth/login/"
      : role === "company"
        ? "/auth/login/company/"
        : "/auth/login/garant/";

  const res = await api.post<LoginResponse>(endpoint, { email, password });
  return res;
}
