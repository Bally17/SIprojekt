"use client";

import { ForgotPasswordPayload } from "@shared-types/auth";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../api";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => requestPasswordReset(payload),
  });
}
