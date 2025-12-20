"use client";

import { useQuery } from "@tanstack/react-query";
import { verifyResetToken } from "src/api/auth-api";

export function useVerifyResetTokenQuery(token: string) {
  return useQuery({
    queryKey: ["verify-reset-token", token],
    queryFn: () => verifyResetToken(token),
    enabled: !!token,
  });
}
