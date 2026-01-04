"use client";

import { useMutation } from "@tanstack/react-query";
import { logout } from "@lib/api";

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (refreshToken: string | null) => logout(refreshToken),
  });
}
