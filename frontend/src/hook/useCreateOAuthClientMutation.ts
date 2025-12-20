"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOAuthClient } from "src/api/oauth-api";
import type { CreateOAuthClientPayload, OAuthClient } from "src/api/oauth-api";

export function useCreateOAuthClientMutation() {
  const qc = useQueryClient();

  return useMutation<OAuthClient, unknown, CreateOAuthClientPayload>({
    mutationFn: (payload) => createOAuthClient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oauth-clients"] });
    },
  });
}
