"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmInternship } from "../api";

export function useConfirmInternshipMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => confirmInternship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "pending-internships"] });
    },
  });
}
