// frontend\src\features\garant\hooks\useUpdateGarantInternshipMutation.ts
"use client";

import { GarantInternshipUpdate } from "@shared-types/internship";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGarantInternship } from "../api";

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
