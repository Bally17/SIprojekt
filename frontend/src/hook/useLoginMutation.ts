"use client";

import { LoginResponse, LoginPayload } from "@shared-types/auth";
import { useMutation } from "@tanstack/react-query";
import { login } from "src/api/auth-api";

export function useLoginMutation() {
  return useMutation<LoginResponse, any, LoginPayload>({
    mutationFn: (payload) => login(payload),
  });
}
