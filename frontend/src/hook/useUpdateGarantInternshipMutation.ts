// src/hook/useUpdateGarantInternshipMutation.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGarantInternship } from "src/api/guarant-internships-api";
import type { GarantInternshipUpdate } from "@type/backend/GarantInternshipUpdate";

export function useUpdateGarantInternshipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: GarantInternshipUpdate }) => {
      await updateGarantInternship(id, payload); // tvoj API call
    },

    onSuccess: () => {
      // po úspechu znovu načíta internships
      queryClient.invalidateQueries({ queryKey: ["garant-internships"] });
    },
  });
}
