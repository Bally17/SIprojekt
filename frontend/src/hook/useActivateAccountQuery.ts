"use client";

import { useQuery } from "@tanstack/react-query";
import { activateAccount, type ActivateResponse } from "src/api/activate-api";

export function useActivateAccountQuery(token: string) {
  return useQuery<ActivateResponse>({
    queryKey: ["activate-account", token],
    queryFn: () => activateAccount(token),
    retry: false,
  });
}
