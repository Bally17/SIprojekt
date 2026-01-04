"use client";

import { ResetPasswordPayload } from "@shared-types/auth";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../api";

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
  });
}
