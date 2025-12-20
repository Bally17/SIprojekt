"use client";

import { useMutation } from "@tanstack/react-query";
import { ResetPasswordPayload, resetPassword } from "src/api/auth-api";

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
  });
}
