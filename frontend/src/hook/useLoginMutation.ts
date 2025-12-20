"use client";

import { useMutation } from "@tanstack/react-query";
import { login, type LoginPayload, type LoginResponse } from "src/api/auth-api";

export function useLoginMutation() {
  return useMutation<LoginResponse, any, LoginPayload>({
    mutationFn: (payload) => login(payload),
  });
}
