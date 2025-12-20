// src/hook/useGarantUpdateInternshipMutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { updateGarantInternship } from "src/api/guarant-internships-api";

export function useGarantUpdateInternshipMutation() {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return updateGarantInternship(id, payload);
    },
  });
}
