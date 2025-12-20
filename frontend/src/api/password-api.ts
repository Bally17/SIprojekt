import { api } from "@lib/ApiProvider";
import { RoleType } from "@type/props/common/globalTypes";

export type ResetPasswordPayload = {
  token: string;
  new_password: string;
  new_password_confirm: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type ProfileUser = {
  id: number;
  email: string;

  first_name?: string | null;
  last_name?: string | null;

  meno?: string | null;
  priezvisko?: string | null;

  full_name?: string | null;

  rola?: RoleType | null;
  role?: RoleType | null;

  firma?: {
    nazov?: string | null;
  } | null;

  musi_zmenit_heslo?: boolean;

  [key: string]: unknown;
};

export type ChangePasswordResponse = {
  user?: ProfileUser | null;
};

export async function resetPassword(payload: ResetPasswordPayload) {
  return api.post("/auth/password/reset/confirm/", payload);
}

export async function requestPasswordReset(payload: ForgotPasswordPayload) {
  return api.post("/auth/password/reset/", payload);
}

export function changePassword(payload: ChangePasswordPayload) {
  return api.post<ChangePasswordResponse>("/auth/password/change/", payload);
}
