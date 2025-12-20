"use client";

import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset, type ForgotPasswordPayload } from "src/api/password-api";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => requestPasswordReset(payload),
  });
}
