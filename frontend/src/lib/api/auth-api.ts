// src/api/auth-api.ts
import { api } from "@lib/ApiProvider";
import { ProfileUser, ProfileResponse, LoginPayload, LoginResponse } from "@shared-types/auth";
import { RoleType } from "@shared-types/core/common";
import { ENDPOINTS } from "src/constants/Endpoints";

/* ----------------------------------------
 * PROFILE API
 * ---------------------------------------- */

export async function getProfile(): Promise<ProfileUser | null> {
  try {
    const res = await api.get<ProfileResponse>(ENDPOINTS.GET_PROFILE);
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
    student: ENDPOINTS.LOGIN_STUDENT,
    company: ENDPOINTS.LOGIN_COMPANY,
    garant: ENDPOINTS.LOGIN_GARANT,
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
  return api.post(ENDPOINTS.LOGOUT, { refresh_token });
}
