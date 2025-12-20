"use client";

import { useQuery } from "@tanstack/react-query";
import { getPendingInternships } from "src/api/company-internships-api";
import type { PendingInternshipsResponse } from "src/api/company-internships-api";

export function usePendingInternshipsQuery() {
  return useQuery<PendingInternshipsResponse, Error>({
    queryKey: ["company", "pending-internships"],
    queryFn: () => getPendingInternships(),
  });
}
