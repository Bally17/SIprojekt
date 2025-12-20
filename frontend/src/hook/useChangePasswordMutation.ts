"use client";

import { ChangePasswordResponse, ChangePasswordPayload } from "@shared-types/auth";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "src/api/password-api";

export function useChangePasswordMutation() {
  return useMutation<ChangePasswordResponse, unknown, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload),
  });
}
