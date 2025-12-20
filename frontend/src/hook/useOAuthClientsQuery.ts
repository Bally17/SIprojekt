"use client";

import { OAuthClient } from "@shared-types/oauth";
import { useQuery } from "@tanstack/react-query";
import { getOAuthClients } from "src/api/oauth-api";

export function useOAuthClientsQuery() {
  return useQuery<OAuthClient[]>({
    queryKey: ["oauth-clients"],
    queryFn: getOAuthClients,
  });
}
