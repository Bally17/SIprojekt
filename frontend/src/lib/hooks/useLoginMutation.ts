"use client";

import { login } from "@lib/api";
import { LoginResponse, LoginPayload } from "@shared-types/auth";
import { useMutation } from "@tanstack/react-query";

export function useLoginMutation() {
  return useMutation<LoginResponse, any, LoginPayload>({
    mutationFn: (payload) => login(payload),
  });
}
