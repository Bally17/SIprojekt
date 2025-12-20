import type { RoleType } from "./core/common";

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
  user?: {
    rola?: RoleType | null;
    role?: RoleType | null;
    [key: string]: unknown;
  } | null;
};

export type RequestResetPasswordPayload = {
  email: string;
};

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

export type ProfileResponse = {
  user?: ProfileUser | null;
};

export type TokenRefresh = {
  refresh: string;
  access?: string;
};

export type TokenVerify = {
  token: string;
};
