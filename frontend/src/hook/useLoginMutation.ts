"use client";

import type { RoleType } from "@type/props/common/globalTypes";
import { login, type LoginResponse } from "@lib/api";
import { useApiMutation } from "@lib/api";

export type LoginVariables = {
  role: RoleType;
  email: string;
  password: string;
};

export function useLoginMutation() {
  return useApiMutation<LoginResponse, LoginVariables>(login);
}
