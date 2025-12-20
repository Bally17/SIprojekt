"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOAuthClient } from "src/api/oauth-api";

export function useDeleteOAuthClientMutation() {
  const qc = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id) => deleteOAuthClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oauth-clients"] });
    },
  });
}
