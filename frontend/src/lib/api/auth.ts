// src/lib/api.ts (alebo src/lib/api/auth.ts – podľa toho, kde to máš)
import { api } from "@lib/api-client";
import type { RoleType } from "@type/props/common/globalTypes";

/* ---------- PROFILE ---------- */

export type ProfileUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  meno?: string;
  priezvisko?: string;
  full_name?: string;
  rola?: RoleType;
  role?: RoleType;
  firma?: {
    nazov?: string | null;
  };
  musi_zmenit_heslo?: boolean;
  [key: string]: unknown;
};

export type ProfileResponse = {
  user?: ProfileUser | null;
};

export async function getProfile(): Promise<ProfileUser | null> {
  try {
    const res = await api.get<ProfileResponse>("/auth/profile/");
    return res.user ?? null;
  } catch (err: any) {
    if (err?.status === 401) {
      // neprihlásený
      return null;
    }
    throw err;
  }
}

/* ---------- LOGIN ---------- */

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
