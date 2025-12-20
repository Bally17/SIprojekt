"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectInternship } from "src/api/company-internships-api";

export function useRejectInternshipMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rejectInternship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "pending-internships"] });
    },
  });
}
