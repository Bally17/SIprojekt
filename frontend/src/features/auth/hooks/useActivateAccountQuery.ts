"use client";

import { useQuery } from "@tanstack/react-query";
import { activateAccount, ActivateResponse } from "../api";

export function useActivateAccountQuery(token: string) {
  return useQuery<ActivateResponse>({
    queryKey: ["activate-account", token],
    queryFn: () => activateAccount(token),
    retry: false,
  });
}
