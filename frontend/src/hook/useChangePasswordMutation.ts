"use client";

import { useMutation } from "@tanstack/react-query";
import {
  changePassword,
  type ChangePasswordPayload,
  type ChangePasswordResponse,
} from "src/api/password-api";

export function useChangePasswordMutation() {
  return useMutation<ChangePasswordResponse, unknown, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload),
  });
}
