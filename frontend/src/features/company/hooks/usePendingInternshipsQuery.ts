"use client";

import { useQuery } from "@tanstack/react-query";
import { PendingInternshipsResponse, getPendingInternships } from "../api";

export function usePendingInternshipsQuery() {
  return useQuery<PendingInternshipsResponse, Error>({
    queryKey: ["company", "pending-internships"],
    queryFn: () => getPendingInternships(),
  });
}
