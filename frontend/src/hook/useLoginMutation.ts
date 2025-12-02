"use client";

import { useMutation } from "@tanstack/react-query";
import type { RoleType } from "@type/props/common/globalTypes";
import { login, type LoginResponse } from "@lib/api";

type LoginVariables = {
  role: RoleType;
  email: string;
  password: string;
};

export function useLoginMutation() {
  return useMutation<LoginResponse, any, LoginVariables>({
    mutationFn: (vars) => login(vars),
  });
}
