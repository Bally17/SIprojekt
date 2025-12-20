// src/api/auth-api.ts
import { api } from "@lib/ApiProvider";
import type { RoleType } from "@type/props/common/globalTypes";

/* ----------------------------------------
 * TYPES
 * ---------------------------------------- */

export type LoginPayload = {
  role: RoleType;
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  refresh_token?: string;

  tokens?: {
    access: string;
    refresh: string;
  };

  user: {
    rola: RoleType;
    [key: string]: unknown;
  };
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type RequestResetPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  new_password: string;
  new_password_confirm: string;
};

/* ----------------------------------------
 * PROFILE TYPES
 * ---------------------------------------- */

export type ProfileUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  meno?: string | null;
  priezvisko?: string | null;
  full_name?: string | null;
  rola?: RoleType | null;

  firma?: {
    nazov?: string | null;
  } | null;

  musi_zmenit_heslo?: boolean;

  [key: string]: unknown;
};

export type ProfileResponse = {
  user?: ProfileUser | null;
};

/* ----------------------------------------
 * PROFILE API
 * ---------------------------------------- */

export async function getProfile(): Promise<ProfileUser | null> {
  try {
    const res = await api.get<ProfileResponse>("/auth/profile/");
    return res.user ?? null;
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status;
    if (status === 401) return null;
    throw err;
  }
}

/* ----------------------------------------
 * LOGIN ENDPOINT SELECTOR
 * ---------------------------------------- */

function getLoginEndpoint(role: RoleType): string {
  const endpoints: Record<RoleType, string> = {
    student: "/auth/login/",
    company: "/auth/login/company/",
    garant: "/auth/login/garant/",
  };

  return endpoints[role];
}

/* ----------------------------------------
 * API CALLS
 * ---------------------------------------- */

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { role, email, password } = payload;

  const endpoint = getLoginEndpoint(role);

  return api.post<LoginResponse>(endpoint, { email, password });
}

export async function logout(refresh_token: string | null) {
  return api.post("/auth/logout/", { refresh_token });
}

export async function changePassword(payload: ChangePasswordPayload) {
  return api.post("/auth/password/change/", payload);
}

export async function requestResetPassword(payload: RequestResetPasswordPayload) {
  return api.post("/auth/password/reset/", payload);
}

export async function verifyResetToken(token: string) {
  return api.post("/auth/password/reset/verify/", { token });
}

export async function resetPassword(payload: ResetPasswordPayload) {
  return api.post("/auth/password/reset/confirm/", payload);
}
